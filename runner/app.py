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


def safe_input(data):
    """Ensure input always ends with newline (important for Scanner/cin/input())"""
    if data is None:
        return "\n"
    return data if data.endswith("\n") else data + "\n"


def run_code(job):
    submission_id = job.get("submissionId")
    language = job.get("language", "").lower()
    source = job.get("source", "")
    test_cases = job.get("testCases", [])
    filename = job.get("filename")
    time_limit = float(job.get("timeLimitSec", 2))

    status = "COMPLETED"
    compile_output = ""
    results = []
    result_payload = {}

    workdir = tempfile.mkdtemp(prefix="runner_")

    try:
        # ================= JAVA =================
        if language == "java":
            filename = filename or "Main.java"
            filepath = os.path.join(workdir, filename)

            with open(filepath, "w") as f:
                f.write(source)

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

                for tc in test_cases:
                    results.append(
                        execute_program(
                            ["java", "-cp", workdir, class_name],
                            workdir,
                            tc,
                            time_limit
                        )
                    )

        # ================= PYTHON =================
        elif language == "python":
            filename = filename or "main.py"
            filepath = os.path.join(workdir, filename)

            with open(filepath, "w") as f:
                f.write(source)

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
                    results.append(
                        execute_program(
                            ["python3", filepath],
                            workdir,
                            tc,
                            time_limit
                        )
                    )

        # ================= C++ =================
        elif language == "cpp":
            filename = filename or "main.cpp"
            filepath = os.path.join(workdir, filename)
            exe_file = os.path.join(workdir, "a.out")

            with open(filepath, "w") as f:
                f.write(source)

            compile_proc = subprocess.run(
                ["g++", filepath, "-O2", "-o", exe_file],
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
                    results.append(
                        execute_program(
                            [exe_file],
                            workdir,
                            tc,
                            time_limit
                        )
                    )

        else:
            status = "FAILED"
            compile_output = f"Unsupported language: {language}"

        result_payload = {
            "submissionId": submission_id,
            "status": status,
            "compileOutput": compile_output,
            "score": 0,
            "results": results
        }

    finally:
        if result_payload:
            send_callback(result_payload)
        shutil.rmtree(workdir, ignore_errors=True)


def execute_program(command, workdir, test_case, time_limit):
    tc_id = test_case.get("testCaseId")
    input_data = safe_input(test_case.get("inputData", ""))

    try:
        start = time.perf_counter()

        proc = subprocess.run(
            command,
            cwd=workdir,
            input=input_data,
            capture_output=True,
            text=True,
            timeout=time_limit
        )

        elapsed = int((time.perf_counter() - start) * 1000)

        stdout = proc.stdout.strip()
        stderr = proc.stderr

        if proc.returncode != 0:
            result_status = "RTE"
        else:
            result_status = "AC"

    except subprocess.TimeoutExpired:
        return {
            "testCaseId": tc_id,
            "status": "TLE",
            "stdout": "",
            "stderr": "",
            "execTimeMs": int(time_limit * 1000),
            "memoryKb": 0
        }

    return {
        "testCaseId": tc_id,
        "status": result_status,
        "stdout": stdout,
        "stderr": stderr,
        "execTimeMs": elapsed,
        "memoryKb": 0
    }


@app.route("/run", methods=["POST"])
def run_job():
    job = request.json or {}
    threading.Thread(target=run_code, args=(job,)).start()
    return jsonify({
        "message": "Job accepted",
        "submissionId": job.get("submissionId")
    }), 202


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)