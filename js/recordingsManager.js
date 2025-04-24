// js/recordingsManager.js
// Frontend script to list and manage recordings stored on the backend

const recordingsContainer = document.getElementById('recordingsContainer');

async function fetchRecordings() {
    try {
        const response = await fetch('/api/recordings');
        const data = await response.json();
        if (data.success) {
            renderRecordings(data.recordings);
        } else {
            console.error('Falha ao buscar gravações:', data.message);
        }
    } catch (error) {
        console.error('Erro ao buscar gravações:', error);
    }
}

function renderRecordings(recordings) {
    recordingsContainer.innerHTML = '';
    if (recordings.length === 0) {
        recordingsContainer.innerHTML = '<p class="text-gray-600">Nenhuma gravação encontrada.</p>';
        return;
    }
    recordings.forEach(rec => {
        const div = document.createElement('div');
        div.className = 'mb-4 border rounded p-3 bg-white shadow';

        const video = document.createElement('video');
        video.src = rec.url;
        video.controls = true;
        video.className = 'w-full rounded mb-2';

        const btnDelete = document.createElement('button');
        btnDelete.textContent = 'Excluir';
        btnDelete.className = 'bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition';
        btnDelete.addEventListener('click', () => deleteRecording(rec.filename));

        div.appendChild(video);
        div.appendChild(btnDelete);

        recordingsContainer.appendChild(div);
    });
}

async function deleteRecording(filename) {
    if (!confirm('Tem certeza que deseja excluir esta gravação?')) return;
    try {
        const response = await fetch(`/api/recordings/${filename}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
            alert('Gravação excluída com sucesso.');
            fetchRecordings();
        } else {
            alert('Falha ao excluir gravação: ' + data.message);
        }
    } catch (error) {
        alert('Erro ao excluir gravação: ' + error.message);
    }
}

// Initialize on page load
window.addEventListener('load', () => {
    fetchRecordings();
});
