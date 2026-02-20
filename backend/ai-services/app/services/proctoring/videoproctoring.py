import cv2
import numpy as np
import base64
import mediapipe as mp
from ultralytics import YOLO
import time
import threading

# -------------------------------
# Load YOLOv8 model
# -------------------------------
YOLO_PATH = "app/services/proctoring/yolov8n.pt"
yolo_model = YOLO(YOLO_PATH)

UNAUTHORIZED_OBJECTS = ["cell phone", "book", "laptop"]

# -------------------------------
# Initialize MediaPipe FaceMesh
# -------------------------------
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    refine_landmarks=True,
    max_num_faces=1,
    min_detection_confidence=0.4,
    min_tracking_confidence=0.4
)

# -------------------------------
# Thread-safe global state
# -------------------------------
state_lock = threading.Lock()

reference_face_data = {
    'face_center': None,
    'face_bbox': None,
    'left_eye_center': None,
    'right_eye_center': None,
    'inter_eye_distance': None
}

proctoring_active = False

# Thresholds
FACE_DEVIATION_THRESHOLD = 150
HEAD_ROTATION_THRESHOLD = 75
EYE_ASPECT_RATIO_THRESHOLD = 0.15
GAZE_DEVIATION_THRESHOLD = 0.35

LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
LEFT_IRIS_INDICES = [468, 469, 470, 471, 472]
RIGHT_IRIS_INDICES = [473, 474, 475, 476, 477]


# ----------------------------------------------------
# Helper Functions
# ----------------------------------------------------
def calculate_eye_aspect_ratio(eye_landmarks):
    if len(eye_landmarks) < 6:
        return 0.3

    v1 = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])
    v2 = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])
    h = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])

    if h == 0:
        return 0.3

    return (v1 + v2) / (2.0 * h)


def calculate_gaze_direction(eye_center, iris_center):
    return (iris_center[0] - eye_center[0], iris_center[1] - eye_center[1])


def get_head_pose(landmarks, frame_w, frame_h):
    try:
        nose_tip = np.array([landmarks[1].x * frame_w, landmarks[1].y * frame_h])
        chin = np.array([landmarks[152].x * frame_w, landmarks[152].y * frame_h])
        left_eye = np.array([landmarks[33].x * frame_w, landmarks[33].y * frame_h])
        right_eye = np.array([landmarks[263].x * frame_w, landmarks[263].y * frame_h])

        eye_center = (left_eye + right_eye) / 2

        eye_width = np.linalg.norm(right_eye - left_eye)
        nose_to_left = np.linalg.norm(nose_tip - left_eye)
        nose_to_right = np.linalg.norm(nose_tip - right_eye)

        yaw_raw = np.degrees(np.arctan2(nose_to_right - nose_to_left, eye_width))
        yaw = yaw_raw * 0.5

        face_height = np.linalg.norm(chin - eye_center)
        nose_to_eye = np.linalg.norm(nose_tip - eye_center)

        pitch_raw = np.degrees(np.arctan2(nose_to_eye, face_height)) - 90
        pitch = pitch_raw * 0.3

        return yaw, pitch
    except:
        return 0, 0


def extract_eye_features(landmarks, frame_w, frame_h):
    left_eye_points = np.array([[landmarks[i].x * frame_w, landmarks[i].y * frame_h]
                                for i in LEFT_EYE_INDICES])
    right_eye_points = np.array([[landmarks[i].x * frame_w, landmarks[i].y * frame_h]
                                 for i in RIGHT_EYE_INDICES])

    left_iris_points = np.array([[landmarks[i].x * frame_w, landmarks[i].y * frame_h]
                                 for i in LEFT_IRIS_INDICES])
    right_iris_points = np.array([[landmarks[i].x * frame_w, landmarks[i].y * frame_h]
                                  for i in RIGHT_IRIS_INDICES])

    left_eye_center = np.mean(left_eye_points, axis=0)
    right_eye_center = np.mean(right_eye_points, axis=0)
    left_iris_center = np.mean(left_iris_points, axis=0)
    right_iris_center = np.mean(right_iris_points, axis=0)

    left_ear = calculate_eye_aspect_ratio(left_eye_points)
    right_ear = calculate_eye_aspect_ratio(right_eye_points)

    left_gaze = calculate_gaze_direction(left_eye_center, left_iris_center)
    right_gaze = calculate_gaze_direction(right_eye_center, right_iris_center)

    return {
        'left_eye_center': left_eye_center.tolist(),
        'right_eye_center': right_eye_center.tolist(),
        'left_iris_center': left_iris_center.tolist(),
        'right_iris_center': right_iris_center.tolist(),
        'left_ear': left_ear,
        'right_ear': right_ear,
        'left_gaze': left_gaze,
        'right_gaze': right_gaze
    }


# ----------------------------------------------------
# API FUNCTIONS (FastAPI will call these)
# ----------------------------------------------------

def get_guidelines():
    return {
        "guidelines": [
            "Ensure proper lighting and camera placement.",
            "Do not use your phone or any external device.",
            "Do not move away from your screen during the test.",
            "Your webcam and microphone must remain ON during the exam.",
            "Unauthorized objects like phones or books will be flagged.",
            "Keep your eyes on the screen at all times.",
            "Do not turn your head away from the camera."
        ]
    }


def reference_frame(data):
    global reference_face_data

    img_data = data.get("frame")
    if not img_data:
        return {"error": "No frame received"}

    img_bytes = base64.b64decode(img_data.split(",")[1])
    np_img = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    if frame is None:
        return {"error": "Invalid frame"}

    h, w, _ = frame.shape
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb)

    if not results.multi_face_landmarks:
        return {"error": "No face detected"}

    landmarks = results.multi_face_landmarks[0].landmark

    xs = [lm.x for lm in landmarks]
    ys = [lm.y for lm in landmarks]
    face_center = (int(np.mean(xs) * w), int(np.mean(ys) * h))

    min_x = int(min(xs) * w)
    max_x = int(max(xs) * w)
    min_y = int(min(ys) * h)
    max_y = int(max(ys) * h)

    padding_x = int((max_x - min_x) * 0.2)
    padding_y = int((max_y - min_y) * 0.2)

    face_bbox = [
        max(0, min_x - padding_x),
        max(0, min_y - padding_y),
        min(w, max_x + padding_x),
        min(h, max_y + padding_y)
    ]

    eye_features = extract_eye_features(landmarks, w, h)
    inter_eye_distance = np.linalg.norm(
        np.array(eye_features['left_eye_center']) -
        np.array(eye_features['right_eye_center'])
    )

    with state_lock:
        reference_face_data = {
            'face_center': face_center,
            'face_bbox': face_bbox,
            'left_eye_center': eye_features['left_eye_center'],
            'right_eye_center': eye_features['right_eye_center'],
            'inter_eye_distance': inter_eye_distance
        }

    return {
        "message": "Reference frame saved",
        "face_center": face_center,
        "face_bbox": face_bbox
    }


def start_proctoring():
    global proctoring_active

    with state_lock:
        if reference_face_data['face_center'] is None:
            return {"error": "Reference frame not set. Capture reference first."}
        proctoring_active = True

    return {"message": "Proctoring started"}


def stop_proctoring():
    global proctoring_active

    with state_lock:
        proctoring_active = False

    return {"message": "Proctoring stopped"}


def process_frame(data):
    global reference_face_data

    img_data = data.get("frame")
    if not img_data:
        return {"error": "No frame received", "success": False}

    img_bytes = base64.b64decode(img_data.split(",")[1])
    np_img = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    if frame is None:
        return {"error": "Failed to decode frame", "success": False}

    frame_h, frame_w, _ = frame.shape
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb)

    face_detected = False
    face_center = None
    face_bbox = None
    deviation = None
    head_rotation = {"yaw": 0, "pitch": 0}
    eye_status = "open"
    gaze_status = "looking_at_screen"
    warnings = []

    if results.multi_face_landmarks:
        face_detected = True
        landmarks = results.multi_face_landmarks[0].landmark

        xs = [lm.x for lm in landmarks]
        ys = [lm.y for lm in landmarks]
        face_center = (int(np.mean(xs) * frame_w), int(np.mean(ys) * frame_h))

        min_x = int(min(xs) * frame_w)
        max_x = int(max(xs) * frame_w)
        min_y = int(min(ys) * frame_h)
        max_y = int(max(ys) * frame_h)
        face_bbox = [min_x, min_y, max_x, max_y]

        if reference_face_data['face_center']:
            deviation = np.linalg.norm(
                np.array(face_center) - np.array(reference_face_data['face_center'])
            )
            if deviation > FACE_DEVIATION_THRESHOLD:
                warnings.append("Face moved significantly from original position")

        yaw, pitch = get_head_pose(landmarks, frame_w, frame_h)
        head_rotation = {"yaw": round(yaw, 2), "pitch": round(pitch, 2)}

        if abs(yaw) > HEAD_ROTATION_THRESHOLD:
            warnings.append(f"Head turned {'right' if yaw > 0 else 'left'} excessively")
        if abs(pitch) > HEAD_ROTATION_THRESHOLD:
            warnings.append(f"Head tilted {'up' if pitch > 0 else 'down'} excessively")

        eye_features = extract_eye_features(landmarks, frame_w, frame_h)

        avg_ear = (eye_features['left_ear'] + eye_features['right_ear']) / 2
        if avg_ear < EYE_ASPECT_RATIO_THRESHOLD:
            eye_status = "closed"
            warnings.append("Eyes appear closed")

        if reference_face_data['inter_eye_distance']:
            left_gaze_norm = np.linalg.norm(eye_features['left_gaze']) / reference_face_data['inter_eye_distance']
            right_gaze_norm = np.linalg.norm(eye_features['right_gaze']) / reference_face_data['inter_eye_distance']
            avg_gaze_deviation = (left_gaze_norm + right_gaze_norm) / 2

            if avg_gaze_deviation > GAZE_DEVIATION_THRESHOLD:
                gaze_status = "looking_away"
                warnings.append("Eyes not focused on screen")

    yolo_results = yolo_model.predict(frame, conf=0.5, verbose=False)
    unauthorized_objects = []

    for r in yolo_results:
        for box in r.boxes:
            label = yolo_model.names[int(box.cls[0])]
            conf = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            area = (x2 - x1) * (y2 - y1)

            if label in UNAUTHORIZED_OBJECTS and area > 5000:
                unauthorized_objects.append({
                    "label": label,
                    "confidence": round(conf, 2),
                    "bbox": [x1, y1, x2, y2]
                })
                warnings.append(f"Unauthorized object detected: {label}")

    status = "ok"

    if not face_detected:
        status = "no_face"
        warnings.append("No face detected")
    elif unauthorized_objects:
        status = "unauthorized_object"
    elif deviation and deviation > FACE_DEVIATION_THRESHOLD * 1.5:
        status = "face_moved"
    elif eye_status == "closed":
        status = "eyes_closed"
    elif gaze_status == "looking_away" and abs(head_rotation['yaw']) > HEAD_ROTATION_THRESHOLD * 0.8:
        status = "looking_away"
    elif len(warnings) >= 2:
        status = "warning"

    return {
        "success": True,
        "status": status,
        "face_detected": face_detected,
        "face_center": face_center,
        "face_bbox": face_bbox,
        "reference_face_center": reference_face_data['face_center'],
        "reference_face_bbox": reference_face_data['face_bbox'],
        "deviation": round(deviation, 2) if deviation else None,
        "head_rotation": head_rotation,
        "eye_status": eye_status,
        "gaze_status": gaze_status,
        "unauthorized_objects": unauthorized_objects,
        "warnings": warnings,
        "timestamp": time.time()
    }


def run_check():
    return {
        "message": "Run endpoint active",
        "proctoring_active": proctoring_active,
        "reference_set": reference_face_data['face_center'] is not None,
        "time": time.time()
    }
