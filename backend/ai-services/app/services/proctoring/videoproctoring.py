import numpy as np
import time
import threading

# -------------------------------
# Thread-safe global state
# -------------------------------
state_lock = threading.Lock()

reference_face_data = {
    "face_center": None,
    "inter_eye_distance": None,
}

proctoring_active = False

# Thresholds (kept from your original logic)
FACE_DEVIATION_THRESHOLD = 150
HEAD_ROTATION_THRESHOLD = 75
EYE_ASPECT_RATIO_THRESHOLD = 0.15
GAZE_DEVIATION_THRESHOLD = 0.35


# ----------------------------------------------------
# API FUNCTIONS
# ----------------------------------------------------

def get_guidelines():
    return {
        "guidelines": [
            "Ensure proper lighting and camera placement.",
            "Do not move away from your screen during the test.",
            "Your webcam and microphone must remain ON during the exam.",
            "Keep your eyes on the screen at all times.",
            "Do not turn your head away from the camera."
        ]
    }


# ----------------------------------------------------
# Reference Frame (NOW RECEIVES JSON LANDMARK DATA)
# ----------------------------------------------------

def reference_frame(data):
    """
    Frontend sends:
    {
        face_center: [x, y],
        inter_eye_distance: float
    }
    """

    face_center = data.get("face_center")
    inter_eye_distance = data.get("inter_eye_distance")

    if not face_center or not inter_eye_distance:
        return {"error": "Invalid reference data"}

    with state_lock:
        reference_face_data["face_center"] = face_center
        reference_face_data["inter_eye_distance"] = inter_eye_distance

    return {
        "message": "Reference frame saved",
        "face_center": face_center
    }


# ----------------------------------------------------
# Start / Stop Proctoring
# ----------------------------------------------------

def start_proctoring():
    global proctoring_active

    with state_lock:
        if reference_face_data["face_center"] is None:
            return {"error": "Reference frame not set."}
        proctoring_active = True

    return {"message": "Proctoring started"}


def stop_proctoring():
    global proctoring_active

    with state_lock:
        proctoring_active = False

    return {"message": "Proctoring stopped"}


# ----------------------------------------------------
# Process Frame (NOW RECEIVES ANALYSIS FROM FRONTEND)
# ----------------------------------------------------

def process_frame(data):
    """
    Frontend sends:
    {
        face_detected: bool,
        face_center: [x, y],
        yaw: float,
        pitch: float,
        ear: float,
        gaze_deviation: float
    }
    """

    if not proctoring_active:
        return {"error": "Proctoring not active", "success": False}

    face_detected = data.get("face_detected", False)
    face_center = data.get("face_center")
    yaw = data.get("yaw", 0)
    pitch = data.get("pitch", 0)
    ear = data.get("ear", 0.3)
    gaze_deviation = data.get("gaze_deviation", 0)

    warnings = []
    status = "ok"
    deviation = None

    if not face_detected:
        status = "no_face"
        warnings.append("No face detected")

    else:
        # Face deviation check
        if reference_face_data["face_center"]:
            deviation = np.linalg.norm(
                np.array(face_center) -
                np.array(reference_face_data["face_center"])
            )
            if deviation > FACE_DEVIATION_THRESHOLD:
                warnings.append("Face moved significantly")

        # Head rotation
        if abs(yaw) > HEAD_ROTATION_THRESHOLD:
            warnings.append("Head turned excessively")

        if abs(pitch) > HEAD_ROTATION_THRESHOLD:
            warnings.append("Head tilted excessively")

        # Eye closure
        if ear < EYE_ASPECT_RATIO_THRESHOLD:
            status = "eyes_closed"
            warnings.append("Eyes appear closed")

        # Gaze
        if reference_face_data["inter_eye_distance"]:
            gaze_norm = gaze_deviation / reference_face_data["inter_eye_distance"]
            if gaze_norm > GAZE_DEVIATION_THRESHOLD:
                status = "looking_away"
                warnings.append("Looking away from screen")

        # Escalation logic (same philosophy as yours)
        if deviation and deviation > FACE_DEVIATION_THRESHOLD * 1.5:
            status = "face_moved"
        elif len(warnings) >= 2:
            status = "warning"

    return {
        "success": True,
        "status": status,
        "face_detected": face_detected,
        "reference_face_center": reference_face_data["face_center"],
        "deviation": round(deviation, 2) if deviation else None,
        "head_rotation": {
            "yaw": round(yaw, 2),
            "pitch": round(pitch, 2)
        },
        "eye_status": "closed" if ear < EYE_ASPECT_RATIO_THRESHOLD else "open",
        "warnings": warnings,
        "timestamp": time.time()
    }


# ----------------------------------------------------
# Health Check
# ----------------------------------------------------

def run_check():
    return {
        "message": "Run endpoint active",
        "proctoring_active": proctoring_active,
        "reference_set": reference_face_data["face_center"] is not None,
        "time": time.time()
    }