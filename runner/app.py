from flask import Flask, request, jsonify
import threading
import subprocess
import os
import tempfile
import requests
import shutil
import time

app = Flask(__name__)

# 🔁 IMPORTANT: Change this after deployment to your Railway backend URL
BACKEND_CALLBACK_URL = os.environ.get(
    "BACKEND_CALLBACK_URL",
    "https://jasoos-production.up.railway.app/api/internal/runner/callback"
)

MAX_COMPILE_OUTPUT = 2000  # limit compile error size


# ================= CALLBACK =================
def send_callback(result_payload):
    try:
        r = requests.post(BACKEND_CALLBACK_URL, json=result_payload, timeout=5)
        print("✅ Callback sent:", r.status_code)
    except Exception as e:
        print("❌ Callback failed:", e)


# ================= SAFE INPUT =================
def safe_input(data):
    if data is None:
        return "\n"
    return data if data.endswith("\n") else data + "\n"


# ================= EXECUTE PROGRAM =================
def execute_program(command, workdir, test_case, time_limit):
    tc_id = test_case.get("testCaseId")
    input_data = safe_input(test_case.get("inputData", ""))

    try:
        start = time.perf_counter()

        proc = subprocess.run(
            command,
            cwd=workdir,
            input=input_data,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=time_limit
        )

        elapsed = int((time.perf_counter() - start) * 1000)

        if proc.returncode != 0:
            result_status = "RTE"
        else:
            result_status = "AC"

        return {
            "testCaseId": tc_id,
            "status": result_status,
            "stdout": proc.stdout.strip(),
            "stderr": proc.stderr,
            "execTimeMs": elapsed,
            "memoryKb": 0
        }

    except subprocess.TimeoutExpired:
        return {
            "testCaseId": tc_id,
            "status": "TLE",
            "stdout": "",
            "stderr": "",
            "execTimeMs": int(time_limit * 1000),
            "memoryKb": 0
        }


# ================= MAIN RUNNER =================
def run_code(job):
    submission_id = job.get("submissionId")
    source = job.get("source", "")
    test_cases = job.get("testCases", [])
    filename = job.get("filename") or "main.cpp"
    time_limit = float(job.get("timeLimitSec", 2))

    status = "COMPLETED"
    compile_output = ""
    results = []

    workdir = tempfile.mkdtemp(prefix="runner_")

    try:
        filepath = os.path.join(workdir, filename)
        exe_file = os.path.join(workdir, "a.out")

        # Write source file
        with open(filepath, "w") as f:
            f.write(source)

        # 🚀 FAST COMPILE FLAGS
        compile_proc = subprocess.run(
            [
                "g++",
                filepath,
                "-O2",
                "-std=c++17",
                "-pipe",
                "-s",
                "-o",
                exe_file
            ],
            cwd=workdir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
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

        result_payload = {
            "submissionId": submission_id,
            "status": status,
            "compileOutput": compile_output,
            "score": 0,
            "results": results
        }

    except Exception as e:
        result_payload = {
            "submissionId": submission_id,
            "status": "FAILED",
            "compileOutput": str(e),
            "score": 0,
            "results": []
        }

    finally:
        send_callback(result_payload)
        shutil.rmtree(workdir, ignore_errors=True)


# ================= ROUTE =================
@app.route("/run", methods=["POST"])
def run_job():
    job = request.json or {}
    threading.Thread(target=run_code, args=(job,), daemon=True).start()
    return jsonify({
        "message": "Job accepted",
        "submissionId": job.get("submissionId")
    }), 202


# ================= START SERVER =================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # ✅ Required for Render
    app.run(host="0.0.0.0", port=port)