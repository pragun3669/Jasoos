from flask import Flask, request, jsonify
import threading, subprocess, os, tempfile, requests, shutil, time

app = Flask(__name__)
BACKEND_CALLBACK_URL = "http://host.docker.internal:8081/api/internal/runner/callback"
MAX_COMPILE_OUTPUT = 2000  # limit compile output length


def send_callback(result_payload):
    try:
        r = requests.post(BACKEND_CALLBACK_URL, json=result_payload)
        print("✅ Callback sent, backend replied:", r.status_code, r.text)
    except Exception as e:
        print("❌ Error calling backend callback:", e)


def run_code(job):
    submission_id = job.get("submissionId")
    language = job.get("language", "").lower()
    source = job.get("source", "")
    test_cases = job.get("testCases", [])
    filename = job.get("filename")
    time_limit = float(job.get("timeLimitSec", 2))  # dynamic timeout per job

    status = "COMPLETED"
    compile_output = ""
    results = []
    result_payload = {}

    # Prepare temp working directory
    workdir = tempfile.mkdtemp(prefix="runner_")
    try:
        if language == "java":
            if not filename:
                filename = "Main.java"
            filepath = os.path.join(workdir, filename)
            with open(filepath, "w") as f:
                f.write(source)

            # Compile
            compile_proc = subprocess.run(
                ["javac", filepath],
                cwd=workdir,
                capture_output=True,
                text=True,
                timeout=10
            )
            if compile_proc.returncode != 0:
                status = "CE"
                compile_output = compile_proc.stderr[:MAX_COMPILE_OUTPUT]
            else:
                class_name = filename.replace(".java", "")
                classpath = workdir
                for tc in test_cases:
                    tc_id = tc.get("testCaseId")
                    input_data = tc.get("inputData", "")
                    try:
                        start = time.perf_counter()
                        proc = subprocess.run(
                            ["java", "-cp", classpath, class_name],
                            cwd=workdir,
                            input=input_data,
                            capture_output=True,
                            text=True,
                            timeout=time_limit
                        )
                        elapsed = (time.perf_counter() - start) * 1000
                        stdout = proc.stdout.strip()
                        stderr = proc.stderr
                        if proc.returncode != 0:
                            result_status = "RTE"
                        else:
                            result_status = "AC"
                    except subprocess.TimeoutExpired:
                        result_status = "TLE"
                        stdout, stderr, elapsed = "", "", int(time_limit * 1000)
                    results.append({
                        "testCaseId": tc_id,
                        "status": result_status,
                        "stdout": stdout,
                        "stderr": stderr,
                        "execTimeMs": int(elapsed),
                        "memoryKb": 0
                    })

        elif language == "python":
            if not filename:
                filename = "main.py"
            filepath = os.path.join(workdir, filename)
            with open(filepath, "w") as f:
                f.write(source)

            # Syntax check
            compile_proc = subprocess.run(
                ["python3", "-m", "py_compile", filepath],
                cwd=workdir,
                capture_output=True,
                text=True,
                timeout=10
            )
            if compile_proc.returncode != 0:
                status = "CE"
                compile_output = compile_proc.stderr[:MAX_COMPILE_OUTPUT]
            else:
                for tc in test_cases:
                    tc_id = tc.get("testCaseId")
                    input_data = tc.get("inputData", "")
                    try:
                        start = time.perf_counter()
                        proc = subprocess.run(
                            ["python3", filepath],
                            cwd=workdir,
                            input=input_data,
                            capture_output=True,
                            text=True,
                            timeout=time_limit
                        )
                        elapsed = (time.perf_counter() - start) * 1000
                        stdout = proc.stdout.strip()
                        stderr = proc.stderr
                        if proc.returncode != 0:
                            result_status = "RTE"
                        else:
                            result_status = "AC"
                    except subprocess.TimeoutExpired:
                        result_status = "TLE"
                        stdout, stderr, elapsed = "", "", int(time_limit * 1000)
                    results.append({
                        "testCaseId": tc_id,
                        "status": result_status,
                        "stdout": stdout,
                        "stderr": stderr,
                        "execTimeMs": int(elapsed),
                        "memoryKb": 0
                    })

        elif language == "cpp":
            if not filename:
                filename = "main.cpp"
            filepath = os.path.join(workdir, filename)
            with open(filepath, "w") as f:
                f.write(source)
            exe_file = os.path.join(workdir, "a.out")

            compile_proc = subprocess.run(
                ["g++", filepath, "-o", exe_file],
                cwd=workdir,
                capture_output=True,
                text=True,
                timeout=10
            )
            if compile_proc.returncode != 0:
                status = "CE"
                compile_output = compile_proc.stderr[:MAX_COMPILE_OUTPUT]
            else:
                for tc in test_cases:
                    tc_id = tc.get("testCaseId")
                    input_data = tc.get("inputData", "")
                    try:
                        start = time.perf_counter()
                        proc = subprocess.run(
                            [exe_file],
                            cwd=workdir,
                            input=input_data,
                            capture_output=True,
                            text=True,
                            timeout=time_limit
                        )
                        elapsed = (time.perf_counter() - start) * 1000
                        stdout = proc.stdout.strip()
                        stderr = proc.stderr
                        if proc.returncode != 0:
                            result_status = "RTE"
                        else:
                            result_status = "AC"
                    except subprocess.TimeoutExpired:
                        result_status = "TLE"
                        stdout, stderr, elapsed = "", "", int(time_limit * 1000)
                    results.append({
                        "testCaseId": tc_id,
                        "status": result_status,
                        "stdout": stdout,
                        "stderr": stderr,
                        "execTimeMs": int(elapsed),
                        "memoryKb": 0
                    })
        else:
            status = "FAILED"
            compile_output = f"Unsupported language: {language}"

        # Score is placeholder (since correctness vs expectedOutput isn’t checked here)
        score = 0

        # Build result payload
        result_payload = {
            "submissionId": submission_id,
            "status": status,
            "compileOutput": compile_output,
            "score": score,
            "results": results
        }
    finally:
        if result_payload:
            send_callback(result_payload)
        shutil.rmtree(workdir, ignore_errors=True)


@app.route("/run", methods=["POST"])
def run_job():
    job = request.json or {}
    threading.Thread(target=run_code, args=(job,)).start()
    return jsonify({"message": "Job accepted", "submissionId": job.get("submissionId")}), 202


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
