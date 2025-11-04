from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import mediapipe as mp
from ultralytics import YOLO
import time
import threading

app = Flask(__name__)
CORS(app, supports_credentials=True, origins="*")

# -------------------------------
# Load YOLOv8 model
# -------------------------------
yolo_model = YOLO("yolov8n.pt")
UNAUTHORIZED_OBJECTS = ["cell phone", "book", "laptop"]

# -------------------------------
# Initialize MediaPipe FaceMesh
# -------------------------------
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    refine_landmarks=True,
    max_num_faces=1,
    min_detection_confidence=0.4,  # More lenient
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

# More flexible thresholds
FACE_DEVIATION_THRESHOLD = 150  # Increased from 100 to 150 pixels
HEAD_ROTATION_THRESHOLD = 75  # Very lenient - 75 degrees
EYE_ASPECT_RATIO_THRESHOLD = 0.15  # More lenient (was 0.18)
GAZE_DEVIATION_THRESHOLD = 0.35  # Very lenient (was 0.30)

# Eye landmark indices for MediaPipe Face Mesh
LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
LEFT_IRIS_INDICES = [468, 469, 470, 471, 472]
RIGHT_IRIS_INDICES = [473, 474, 475, 476, 477]


# -------------------------------
# Helper Functions
# -------------------------------
def calculate_eye_aspect_ratio(eye_landmarks):
    """Calculate Eye Aspect Ratio to detect blinks/closed eyes"""
    if len(eye_landmarks) < 6:
        return 0.3
    
    v1 = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])
    v2 = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])
    h = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])
    
    if h == 0:
        return 0.3
    
    ear = (v1 + v2) / (2.0 * h)
    return ear


def calculate_gaze_direction(eye_center, iris_center):
    """Calculate gaze direction relative to eye center"""
    return (iris_center[0] - eye_center[0], iris_center[1] - eye_center[1])


def get_head_pose(landmarks, frame_w, frame_h):
    """Estimate head pose angles using facial landmarks - Very lenient for natural posture"""
    try:
        nose_tip = np.array([landmarks[1].x * frame_w, landmarks[1].y * frame_h])
        chin = np.array([landmarks[152].x * frame_w, landmarks[152].y * frame_h])
        left_eye = np.array([landmarks[33].x * frame_w, landmarks[33].y * frame_h])
        right_eye = np.array([landmarks[263].x * frame_w, landmarks[263].y * frame_h])
        left_mouth = np.array([landmarks[61].x * frame_w, landmarks[61].y * frame_h])
        right_mouth = np.array([landmarks[291].x * frame_w, landmarks[291].y * frame_h])
        
        eye_center = (left_eye + right_eye) / 2
        mouth_center = (left_mouth + right_mouth) / 2
        
        # Yaw (left-right rotation) - more lenient calculation
        eye_width = np.linalg.norm(right_eye - left_eye)
        nose_to_left = np.linalg.norm(nose_tip - left_eye)
        nose_to_right = np.linalg.norm(nose_tip - right_eye)
        
        # Add heavy dampening factor to reduce sensitivity
        yaw_raw = np.degrees(np.arctan2(nose_to_right - nose_to_left, eye_width))
        yaw = yaw_raw * 0.5  # Dampen by 50%
        
        # Pitch (up-down rotation) - VERY lenient for natural sitting posture
        face_height = np.linalg.norm(chin - eye_center)
        nose_to_eye = np.linalg.norm(nose_tip - eye_center)
        
        # Very lenient pitch calculation with heavy dampening
        # Natural head tilt when looking at screen is around 10-20 degrees down
        pitch_raw = np.degrees(np.arctan2(nose_to_eye, face_height)) - 90
        pitch = pitch_raw * 0.3  # Dampen by 70% - extremely lenient for natural head position
        
        return yaw, pitch
    except:
        return 0, 0


def extract_eye_features(landmarks, frame_w, frame_h):
    """Extract eye landmarks and calculate features"""
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


# -------------------------------
# ROUTE: Get Exam Guidelines
# -------------------------------
@app.route("/get-guidelines", methods=["GET"])
def get_guidelines():
    guidelines = [
        "Ensure proper lighting and camera placement.",
        "Do not use your phone or any external device.",
        "Do not move away from your screen during the test.",
        "Your webcam and microphone must remain ON during the exam.",
        "Unauthorized objects like phones or books will be flagged.",
        "Keep your eyes on the screen at all times.",
        "Do not turn your head away from the camera."
    ]
    return jsonify({"guidelines": guidelines})


# -------------------------------
# ROUTE: Capture Reference Frame
# -------------------------------
@app.route("/reference-frame", methods=["POST"])
def reference_frame():
    global reference_face_data
    try:
        data = request.json
        img_data = data.get("frame")

        if not img_data:
            return jsonify({"error": "No frame received"}), 400

        img_bytes = base64.b64decode(img_data.split(",")[1])
        np_img = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
        if frame is None:
            return jsonify({"error": "Invalid frame"}), 400

        h, w, _ = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb)

        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0].landmark
            
            # Calculate face center
            xs = [lm.x for lm in landmarks]
            ys = [lm.y for lm in landmarks]
            face_center = (int(np.mean(xs) * w), int(np.mean(ys) * h))
            
            # Calculate face bounding box with extra padding for flexibility
            min_x = int(min(xs) * w)
            max_x = int(max(xs) * w)
            min_y = int(min(ys) * h)
            max_y = int(max(ys) * h)
            
            # Add padding to make the box more flexible (20% padding)
            padding_x = int((max_x - min_x) * 0.2)
            padding_y = int((max_y - min_y) * 0.2)
            
            min_x = max(0, min_x - padding_x)
            max_x = min(w, max_x + padding_x)
            min_y = max(0, min_y - padding_y)
            max_y = min(h, max_y + padding_y)
            
            face_bbox = [min_x, min_y, max_x, max_y]
            
            # Extract eye features
            eye_features = extract_eye_features(landmarks, w, h)
            
            # Calculate inter-eye distance for normalization
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
            
            print(f"✅ Reference face captured at {face_center}")
            print(f"   Face bbox (with padding): {face_bbox}")
            print(f"   Inter-eye distance: {inter_eye_distance:.2f}")
            
            return jsonify({
                "message": "Reference frame saved",
                "face_center": face_center,
                "face_bbox": face_bbox
            })
        else:
            return jsonify({"error": "No face detected"}), 400
    except Exception as e:
        print(f"❌ Error in reference_frame: {str(e)}")
        return jsonify({"error": str(e)}), 500


# -------------------------------
# ROUTE: Start Proctoring
# -------------------------------
@app.route("/start-proctoring", methods=["POST"])
def start_proctoring():
    global proctoring_active
    with state_lock:
        if reference_face_data['face_center'] is None:
            return jsonify({"error": "Reference frame not set. Capture reference first."}), 400
        proctoring_active = True
    print("✅ Proctoring started")
    return jsonify({"message": "Proctoring started"})


# -------------------------------
# ROUTE: Stop Proctoring
# -------------------------------
@app.route("/stop-proctoring", methods=["POST"])
def stop_proctoring():
    global proctoring_active
    with state_lock:
        proctoring_active = False
    print("🛑 Proctoring stopped")
    return jsonify({"message": "Proctoring stopped"})


# -------------------------------
# ROUTE: Set Reference (Alias)
# -------------------------------
@app.route("/set-reference", methods=["POST"])
def set_reference():
    return reference_frame()


# -------------------------------
# ROUTE: Process Live Frame
# -------------------------------
@app.route("/process-frame", methods=["POST"])
def process_frame():
    global reference_face_data
    try:
        data = request.json
        img_data = data.get("frame")

        if not img_data:
            return jsonify({"error": "No frame received", "success": False}), 400

        img_bytes = base64.b64decode(img_data.split(",")[1])
        np_img = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
        if frame is None:
            return jsonify({"error": "Failed to decode frame", "success": False}), 400

        frame_h, frame_w, _ = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb)

        # Initialize response data
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
            
            # Calculate face center
            xs = [lm.x for lm in landmarks]
            ys = [lm.y for lm in landmarks]
            face_center = (int(np.mean(xs) * frame_w), int(np.mean(ys) * frame_h))
            
            # Calculate face bounding box
            min_x = int(min(xs) * frame_w)
            max_x = int(max(xs) * frame_w)
            min_y = int(min(ys) * frame_h)
            max_y = int(max(ys) * frame_h)
            face_bbox = [min_x, min_y, max_x, max_y]
            
            # Calculate deviation from reference (more lenient)
            if reference_face_data['face_center']:
                deviation = np.linalg.norm(
                    np.array(face_center) - np.array(reference_face_data['face_center'])
                )
                
                # Only warn if deviation is significant
                if deviation > FACE_DEVIATION_THRESHOLD:
                    warnings.append("Face moved significantly from original position")
            
            # Head pose estimation (more lenient) - Only warn for EXTREME angles
            yaw, pitch = get_head_pose(landmarks, frame_w, frame_h)
            head_rotation = {"yaw": round(yaw, 2), "pitch": round(pitch, 2)}
            
            # Only warn for extreme head turns (not natural viewing angles)
            if abs(yaw) > HEAD_ROTATION_THRESHOLD:
                warnings.append(f"Head turned {'right' if yaw > 0 else 'left'} excessively")
            if abs(pitch) > HEAD_ROTATION_THRESHOLD:
                warnings.append(f"Head tilted {'up' if pitch > 0 else 'down'} excessively")
            
            # Eye tracking (more lenient)
            eye_features = extract_eye_features(landmarks, frame_w, frame_h)
            
            # Check if eyes are closed (more lenient)
            avg_ear = (eye_features['left_ear'] + eye_features['right_ear']) / 2
            if avg_ear < EYE_ASPECT_RATIO_THRESHOLD:
                eye_status = "closed"
                warnings.append("Eyes appear closed")
            
            # Check gaze direction (more lenient)
            if reference_face_data['inter_eye_distance']:
                left_gaze_norm = np.linalg.norm(eye_features['left_gaze']) / reference_face_data['inter_eye_distance']
                right_gaze_norm = np.linalg.norm(eye_features['right_gaze']) / reference_face_data['inter_eye_distance']
                avg_gaze_deviation = (left_gaze_norm + right_gaze_norm) / 2
                
                # Only warn for significant gaze deviation
                if avg_gaze_deviation > GAZE_DEVIATION_THRESHOLD:
                    gaze_status = "looking_away"
                    warnings.append("Eyes not focused on screen")

        # YOLO object detection (more strict - this should be flagged)
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

        # Determine overall status (more lenient with priority logic)
        status = "ok"
        
        if not face_detected:
            status = "no_face"
            warnings.append("No face detected")
        elif unauthorized_objects:
            # Unauthorized objects are serious - always flag
            status = "unauthorized_object"
        elif deviation and deviation > FACE_DEVIATION_THRESHOLD * 1.5:  
            # Only flag if face moved WAY outside the safe zone (50% more lenient)
            status = "face_moved"
        elif eye_status == "closed":
            # Only flag if eyes are clearly closed
            status = "eyes_closed"
        elif gaze_status == "looking_away" and (abs(head_rotation['yaw']) > HEAD_ROTATION_THRESHOLD * 0.8):
            # Only flag looking away if BOTH gaze AND head rotation are off
            status = "looking_away"
        elif len(warnings) >= 2:
            # Only show warning status if multiple warnings present
            status = "warning"
        # Otherwise status remains "ok" even with minor deviations

        return jsonify({
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
        })

    except Exception as e:
        print(f"❌ Error in process_frame: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "success": False}), 500


# -------------------------------
# ROUTE: Run (Health Check)
# -------------------------------
@app.route("/run", methods=["POST"])
def run_check():
    return jsonify({
        "message": "Run endpoint active",
        "proctoring_active": proctoring_active,
        "reference_set": reference_face_data['face_center'] is not None,
        "time": time.time()
    })


@app.route("/")
def home():
    return jsonify({
        "message": "✅ Proctoring backend running",
        "endpoints": [
            "/get-guidelines",
            "/reference-frame",
            "/start-proctoring",
            "/stop-proctoring",
            "/process-frame",
            "/set-reference",
            "/run"
        ]
    })


if __name__ == "__main__":
    print("✅ Flask backend running at http://127.0.0.1:5001")
    print("📋 Available endpoints:")
    print("   GET  /get-guidelines")
    print("   POST /reference-frame")
    print("   POST /start-proctoring")
    print("   POST /stop-proctoring")
    print("   POST /process-frame")
    print("   POST /set-reference")
    print("   POST /run")
    app.run(host="0.0.0.0", port=5001, debug=True)