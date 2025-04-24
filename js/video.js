// js/video.js
// Handles video recording functionality using MediaRecorder API

const videoPreview = document.getElementById('videoPreview');
const btnRecord = document.getElementById('btnRecord');
const btnPause = document.getElementById('btnPause');
const btnResume = document.getElementById('btnResume');
const btnStop = document.getElementById('btnStop');
const btnDownload = document.getElementById('btnDownload');
const recordingsList = document.getElementById('recordingsList');

let mediaRecorder;
let recordedChunks = [];
let stream;
let recordings = [];

// Initialize media stream and preview
async function initMedia() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        videoPreview.srcObject = stream;
    } catch (err) {
        alert('Erro ao acessar a câmera e microfone: ' + err.message);
        console.error('Media access error:', err);
    }
}

// Start recording
btnRecord.addEventListener('click', () => {
    if (!stream) {
        alert('Câmera não inicializada.');
        return;
    }
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp8,opus' });

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        addRecording(url, blob);
        btnDownload.href = url;
        btnDownload.classList.remove('hidden');
        // Upload the recording to the backend
        uploadRecording(blob);
    };

    mediaRecorder.start();
    toggleButtons('recording');
});

// Pause recording
btnPause.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
        toggleButtons('paused');
    }
});

// Resume recording
btnResume.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
        toggleButtons('recording');
    }
});

// Stop recording
btnStop.addEventListener('click', () => {
    if (mediaRecorder && (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused')) {
        mediaRecorder.stop();
        toggleButtons('stopped');
    }
});

// Toggle button visibility based on state
function toggleButtons(state) {
    switch(state) {
        case 'recording':
            btnRecord.classList.add('hidden');
            btnPause.classList.remove('hidden');
            btnResume.classList.add('hidden');
            btnStop.classList.remove('hidden');
            btnDownload.classList.add('hidden');
            break;
        case 'paused':
            btnRecord.classList.add('hidden');
            btnPause.classList.add('hidden');
            btnResume.classList.remove('hidden');
            btnStop.classList.remove('hidden');
            btnDownload.classList.add('hidden');
            break;
        case 'stopped':
            btnRecord.classList.remove('hidden');
            btnPause.classList.add('hidden');
            btnResume.classList.add('hidden');
            btnStop.classList.add('hidden');
            // btnDownload shown on mediaRecorder.onstop
            break;
        default:
            btnRecord.classList.remove('hidden');
            btnPause.classList.add('hidden');
            btnResume.classList.add('hidden');
            btnStop.classList.add('hidden');
            btnDownload.classList.add('hidden');
    }
}

// Add recording to history list
function addRecording(url, blob) {
    const li = document.createElement('li');
    li.className = 'border rounded p-2 flex flex-col';

    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    video.className = 'rounded mb-2';

    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `gravacao_${new Date().toISOString()}.webm`;
    downloadLink.textContent = 'Baixar';
    downloadLink.className = 'text-blue-600 hover:underline';

    li.appendChild(video);
    li.appendChild(downloadLink);

    recordingsList.prepend(li);
    recordings.push({ url, blob });
}

// Upload recording to backend
async function uploadRecording(blob) {
    const formData = new FormData();
    formData.append('video', blob, `gravacao_${new Date().toISOString()}.webm`);

    try {
        const response = await fetch('/api/recordings/upload', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (result.success) {
            console.log('Gravação enviada com sucesso:', result.filename);
        } else {
            console.error('Falha ao enviar gravação:', result.message);
        }
    } catch (error) {
        console.error('Erro ao enviar gravação:', error);
    }
}

// Initialize on page load
window.addEventListener('load', () => {
    initMedia();
    toggleButtons('default');
});
