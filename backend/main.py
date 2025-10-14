from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import cv2
import mediapipe as mp
import numpy as np
import time
import threading
import base64
from ultralytics import YOLO
import json

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Store active proctoring sessions
active_sessions = {}

# Initialize models globally
mp_face_mesh = mp.solutions.face_mesh
yolo_model = YOLO("yolov8n.pt")

class ProctoringSession:
    def __init__(self, session_id, student_id):
        self.session_id = session_id
        self.student_id = student_id
        self.is_active = False
        self.thread = None
        self.cap = None
        self.face_mesh = None
        
        # Reference calibration
        self.reference_face_x = None
        self.reference_eye_x = None
        self.reference_done = False
        
        # Warnings and counts
        self.warnings = {
            'face_warnings': 0,
            'eye_warnings': 0,
            'combined_warnings': 0,
            'device_alerts': [],
            'no_face_warnings': 0,
            'total_warnings': 0
        }
        
        # Thresholds
        self.FACE_SIDE_THRESHOLD = 40
        self.EYE_SIDE_THRESHOLD = 15
        self.warning_cooldown = 5
        self.last_warning_time = 0
        
        self.start_time = time.time()
        
    def compute_face_deviation(self, landmarks, frame_w):
        nose_tip = landmarks[1]
        cx = int(nose_tip.x * frame_w)
        if self.reference_face_x is None:
            return 0, cx
        return abs(cx - self.reference_face_x), cx
    
    def compute_eye_deviation(self, landmarks, frame_w):
        left_eye = landmarks[33]
        right_eye = landmarks[263]
        eye_cx = int((left_eye.x + right_eye.x) / 2 * frame_w)
        if self.reference_eye_x is None:
            return 0, eye_cx
        return abs(eye_cx - self.reference_eye_x), eye_cx
    
    def emit_warning(self, warning_type, data):
        """Emit warning to connected clients via SocketIO"""
        self.warnings['total_warnings'] = (
            self.warnings['face_warnings'] + 
            self.warnings['eye_warnings'] + 
            self.warnings['combined_warnings'] + 
            self.warnings['no_face_warnings']
        )
        
        socketio.emit('proctoring_update', {
            'session_id': self.session_id,
            'type': warning_type,
            'warnings': self.warnings,
            'data': data,
            'timestamp': time.time()
        })
    
    def start_monitoring(self):
        """Main proctoring loop"""
        self.is_active = True
        self.cap = cv2.VideoCapture(0)
        self.face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True, max_num_faces=1)
        
        print(f"Proctoring started for session: {self.session_id}")
        
        # Auto-calibrate after 3 seconds
        auto_reference_time = time.time() + 3
        
        while self.is_active:
            ret, frame = self.cap.read()
            if not ret:
                break
            
            frame_h, frame_w, _ = frame.shape
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.face_mesh.process(rgb)
            
            # Auto-capture reference
            if not self.reference_done and time.time() >= auto_reference_time:
                if results.multi_face_landmarks:
                    landmarks = results.multi_face_landmarks[0].landmark
                    nose_tip = landmarks[1]
                    self.reference_face_x = int(nose_tip.x * frame_w)
                    left_eye = landmarks[33]
                    right_eye = landmarks[263]
                    self.reference_eye_x = int((left_eye.x + right_eye.x) / 2 * frame_w)
                    self.reference_done = True
                    print(f"Reference captured for session {self.session_id}")
                    self.emit_warning('reference_captured', {'auto': True})
            
            if results.multi_face_landmarks:
                landmarks = results.multi_face_landmarks[0].landmark
                
                if self.reference_done:
                    # Check face and eye deviations
                    face_dev, _ = self.compute_face_deviation(landmarks, frame_w)
                    eye_dev, _ = self.compute_eye_deviation(landmarks, frame_w)
                    current_time = time.time()
                    
                    if (face_dev > self.FACE_SIDE_THRESHOLD) and (eye_dev > self.EYE_SIDE_THRESHOLD):
                        if current_time - self.last_warning_time > self.warning_cooldown:
                            self.warnings['combined_warnings'] += 1
                            self.last_warning_time = current_time
                            print(f"⚠ COMBINED WARNING {self.warnings['combined_warnings']}")
                            self.emit_warning('combined', {
                                'face_dev': face_dev,
                                'eye_dev': eye_dev
                            })
                    
                    elif face_dev > self.FACE_SIDE_THRESHOLD:
                        if current_time - self.last_warning_time > self.warning_cooldown:
                            self.warnings['face_warnings'] += 1
                            self.last_warning_time = current_time
                            print(f"⚠ FACE WARNING {self.warnings['face_warnings']}")
                            self.emit_warning('face', {'deviation': face_dev})
                    
                    elif eye_dev > self.EYE_SIDE_THRESHOLD:
                        if current_time - self.last_warning_time > self.warning_cooldown:
                            self.warnings['eye_warnings'] += 1
                            self.last_warning_time = current_time
                            print(f"⚠ EYE WARNING {self.warnings['eye_warnings']}")
                            self.emit_warning('eye', {'deviation': eye_dev})
            
            else:
                # No face detected
                if self.reference_done and (time.time() - self.last_warning_time > self.warning_cooldown):
                    self.warnings['no_face_warnings'] += 1
                    self.last_warning_time = time.time()
                    print(f"⚠ NO FACE WARNING {self.warnings['no_face_warnings']}")
                    self.emit_warning('no_face', {})
            
            # YOLO device detection
            if self.reference_done:
                yolo_results = yolo_model.predict(frame, conf=0.6, verbose=False)
                for r in yolo_results:
                    for box in r.boxes:
                        cls = int(box.cls[0])
                        label = yolo_model.names[cls]
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        area = (x2-x1)*(y2-y1)
                        
                        if label in ["cell phone", "laptop"] and area > 5000:
                            alert = {
                                'device': label,
                                'timestamp': time.time(),
                                'area': area
                            }
                            self.warnings['device_alerts'].append(alert)
                            print(f"❌ DEVICE ALERT: {label} detected")
                            self.emit_warning('device', alert)
            
            # Small delay to prevent CPU overload
            time.sleep(0.1)
        
        # Cleanup
        self.cap.release()
        self.face_mesh.close()
        print(f"Proctoring stopped for session: {self.session_id}")
    
    def stop_monitoring(self):
        """Stop the proctoring session"""
        self.is_active = False
        if self.thread:
            self.thread.join(timeout=2)
        return self.get_summary()
    
    def get_summary(self):
        """Get session summary"""
        return {
            'session_id': self.session_id,
            'student_id': self.student_id,
            'duration': time.time() - self.start_time,
            'warnings': self.warnings,
            'reference_captured': self.reference_done
        }


# REST API Endpoints

@app.route('/api/proctoring/start', methods=['POST'])
def start_proctoring():
    """Start a new proctoring session"""
    data = request.json
    session_id = data.get('sessionId')
    student_id = data.get('studentId')
    
    if not session_id or not student_id:
        return jsonify({'success': False, 'message': 'Missing session or student ID'}), 400
    
    # Create new session
    session = ProctoringSession(session_id, student_id)
    active_sessions[session_id] = session
    
    # Start monitoring in separate thread
    session.thread = threading.Thread(target=session.start_monitoring)
    session.thread.daemon = True
    session.thread.start()
    
    return jsonify({
        'success': True,
        'sessionId': session_id,
        'message': 'Proctoring started successfully'
    })


@app.route('/api/proctoring/stop', methods=['POST'])
def stop_proctoring():
    """Stop a proctoring session"""
    data = request.json
    session_id = data.get('sessionId')
    
    session = active_sessions.get(session_id)
    if not session:
        return jsonify({'success': False, 'message': 'Session not found'}), 404
    
    summary = session.stop_monitoring()
    del active_sessions[session_id]
    
    return jsonify({
        'success': True,
        'summary': summary
    })


@app.route('/api/proctoring/status/<session_id>', methods=['GET'])
def get_status(session_id):
    """Get current status of a proctoring session"""
    session = active_sessions.get(session_id)
    
    if not session:
        return jsonify({'success': False, 'message': 'Session not found'}), 404
    
    return jsonify({
        'success': True,
        'isActive': session.is_active,
        'warnings': session.warnings,
        'duration': time.time() - session.start_time,
        'referenceCaptured': session.reference_done
    })


@app.route('/api/proctoring/sessions', methods=['GET'])
def get_active_sessions():
    """Get all active sessions"""
    sessions_data = []
    for session_id, session in active_sessions.items():
        sessions_data.append({
            'sessionId': session_id,
            'studentId': session.student_id,
            'isActive': session.is_active,
            'warnings': session.warnings
        })
    
    return jsonify({
        'success': True,
        'sessions': sessions_data,
        'count': len(sessions_data)
    })


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'active_sessions': len(active_sessions)
    })


# SocketIO Events

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('connected', {'message': 'Connected to proctoring server'})


@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')


@socketio.on('ping')
def handle_ping():
    emit('pong', {'timestamp': time.time()})


if __name__ == '__main__':
    print("="*50)
    print("Proctoring Backend Server Starting...")
    print("REST API: http://localhost:5001")
    print("WebSocket: ws://localhost:5001")
    print("="*50)
    socketio.run(app, debug=True, host='0.0.0.0', port=5001, allow_unsafe_werkzeug=True)