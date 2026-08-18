let vocabList = [];
let currentVocabIndex = -1;
let autoNextTimeout = null;
let revealedIndices = [];
let remainingIndices = [];

try {
  const savedData = localStorage.getItem('my_vocab_list');
  if (savedData) vocabList = JSON.parse(savedData);
} catch (e) {
  console.log('Local storage unavailable.');
}

const vocabForm = document.getElementById('vocab-form');
const vocabListUI = document.getElementById('vocab-list');
const vocabCountUI = document.getElementById('vocab-count');
const flashcard = document.getElementById('flashcard');
const cardFrontText = document.getElementById('card-front-text');
const cardBackText = document.getElementById('card-back-text');
const frontLabel = document.getElementById('front-label');
const backLabel = document.getElementById('back-label');
const nextCardBtn = document.getElementById('next-card-btn');
const cardModeSelect = document.getElementById('card-mode');

const startStudyBtn = document.getElementById('start-study-btn');
const closeStudyBtn = document.getElementById('close-study-btn');
const studySection = document.getElementById('study-section');
const addSection = document.getElementById('add-section');
const listSection = document.getElementById('list-section');

const answerInput = document.getElementById('answer-input');
const checkBtn = document.getElementById('check-btn');
const skipBtn = document.getElementById('skip-btn');
const hintBtn = document.getElementById('hint-btn');
const hintContainer = document.getElementById('hint-container');
const feedback = document.getElementById('feedback');

renderVocabs();

startStudyBtn.addEventListener('click', () => {
  if (vocabList.length === 0) {
    alert('Your vocabulary list is empty! Add some words first.');
    return;
  }
  studySection.classList.remove('hidden');
  addSection.classList.add('hidden');
  listSection.classList.add('hidden');
  startStudyBtn.classList.add('hidden');
  
  resetRemainingIndices();
  loadNextCard();
});

closeStudyBtn.addEventListener('click', () => {
  clearTimeout(autoNextTimeout);
  studySection.classList.add('hidden');
  addSection.classList.remove('hidden');
  listSection.classList.remove('hidden');
  startStudyBtn.classList.remove('hidden');
});

vocabForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const word = document.getElementById('word').value.trim();
  const meaning = document.getElementById('meaning').value.trim();

  if (!word || !meaning) return;

  vocabList.push({ id: Date.now(), word, meaning });
  saveData();
  renderVocabs();
  resetRemainingIndices();
  vocabForm.reset();
});

function deleteVocab(id) {
  vocabList = vocabList.filter(item => item.id !== id);
  saveData();
  renderVocabs();
  resetRemainingIndices();
}

flashcard.addEventListener('click', () => flashcard.classList.toggle('flipped'));
nextCardBtn.addEventListener('click', loadNextCard);
skipBtn.addEventListener('click', () => flashcard.classList.toggle('flipped'));

cardModeSelect.addEventListener('change', () => {
  if (currentVocabIndex !== -1 && vocabList[currentVocabIndex]) {
    displayCardContent(vocabList[currentVocabIndex]);
  }
});

hintBtn.addEventListener('click', generateHint);

function generateHint() {
  if (currentVocabIndex === -1 || vocabList.length === 0) return;

  const currentItem = vocabList[currentVocabIndex];
  const mode = cardModeSelect.value;
  const targetText = (mode === 'en-vi' ? currentItem.meaning : currentItem.word).trim();

  if (revealedIndices.length === 0) {
    for (let i = 0; i < targetText.length; i++) {
      if (targetText[i] === ' ') revealedIndices.push(i);
    }
  }

  let unrevealed = [];
  for (let i = 0; i < targetText.length; i++) {
    if (!revealedIndices.includes(i)) {
      unrevealed.push(i);
    }
  }

  if (unrevealed.length > 0) {
    const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    revealedIndices.push(randomIndex);
  }

  let hintStr = '';
  for (let i = 0; i < targetText.length; i++) {
    if (revealedIndices.includes(i)) {
      hintStr += targetText[i];
    } else {
      hintStr += '_';
    }
  }

  hintContainer.innerText = hintStr;
  hintContainer.classList.remove('hidden');
}

checkBtn.addEventListener('click', checkAnswer);
answerInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') checkAnswer();
});

function checkAnswer() {
  if (currentVocabIndex === -1 || vocabList.length === 0) return;

  const userAns = answerInput.value.trim().toLowerCase();
  const currentItem = vocabList[currentVocabIndex];
  const mode = cardModeSelect.value;
  
  const rawTarget = (mode === 'en-vi' ? currentItem.meaning : currentItem.word).trim().toLowerCase();

  if (!userAns) {
    showFeedback('wrong', '⚠️ Please enter your answer before checking!');
    return;
  }

  const validAnswers = rawTarget.split(/[,;]/).map(ans => ans.trim()).filter(ans => ans.length > 0);
  const isCorrect = validAnswers.some(target => userAns === target);

  if (isCorrect) {
    showFeedback('correct', '🎉 Correct! Loading next word...');
    flashcard.classList.add('flipped');
    
    clearTimeout(autoNextTimeout);
    autoNextTimeout = setTimeout(() => {
      loadNextCard();
    }, 800);
  } else {
    showFeedback('wrong', `❌ Incorrect! Please try again.`);
  }
}

function showFeedback(type, message) {
  feedback.className = `feedback-msg ${type}`;
  feedback.innerText = message;
}

function resetFeedback() {
  feedback.className = 'feedback-msg';
  feedback.innerText = '';
  answerInput.value = '';
  hintContainer.classList.add('hidden');
  hintContainer.innerText = '';
  revealedIndices = [];
}

function resetRemainingIndices() {
  remainingIndices = vocabList.map((_, index) => index);
}

function loadNextCard() {
  clearTimeout(autoNextTimeout);
  flashcard.classList.remove('flipped');
  resetFeedback();

  if (vocabList.length === 0) {
    cardFrontText.innerText = "No vocabulary available!";
    cardBackText.innerText = "";
    currentVocabIndex = -1;
    return;
  }

  if (remainingIndices.length === 0) {
    resetRemainingIndices();
  }

  const randomPosition = Math.floor(Math.random() * remainingIndices.length);
  currentVocabIndex = remainingIndices[randomPosition];
  remainingIndices.splice(randomPosition, 1);

  setTimeout(() => {
    displayCardContent(vocabList[currentVocabIndex]);
    answerInput.focus();
  }, 150);
}

function displayCardContent(item) {
  const mode = cardModeSelect.value;
  if (mode === 'en-vi') {
    frontLabel.innerText = "English"; 
    backLabel.innerText = "Vietnamese";
    cardFrontText.innerText = item.word; 
    cardBackText.innerText = item.meaning;
    answerInput.placeholder = "Type Vietnamese meaning...";
  } else {
    frontLabel.innerText = "Vietnamese"; 
    backLabel.innerText = "English";
    cardFrontText.innerText = item.meaning; 
    cardBackText.innerText = item.word;
    answerInput.placeholder = "Type English word...";
  }
}

function saveData() {
  try {
    localStorage.setItem('my_vocab_list', JSON.stringify(vocabList));
  } catch (e) {}
}

function renderVocabs() {
  vocabListUI.innerHTML = '';
  vocabCountUI.innerText = vocabList.length;
  if (vocabList.length === 0) {
    vocabListUI.innerHTML = '<li style="justify-content: center; color: var(--text-sub);">Add your first word above to get started! ✨</li>';
    return;
  }
  vocabList.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="word-info">
        <strong>${escapeHtml(item.word)}</strong>
        <p>${escapeHtml(item.meaning)}</p>
      </div>
      <button class="btn-delete" onclick="deleteVocab(${item.id})">✕</button>
    `;
    vocabListUI.appendChild(li);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

document.getElementById('export-btn').addEventListener('click', () => {
  if (vocabList.length === 0) return alert('No vocabulary to export!');
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vocabList, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "vocab_backup.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
});

const fileInput = document.getElementById('file-input');
document.getElementById('import-btn').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      vocabList = JSON.parse(event.target.result);
      saveData();
      renderVocabs();
      resetRemainingIndices();
    } catch (err) {
      alert('Invalid file format!');
    }
  };
  reader.readAsText(file);
});
const toggleDictBtn = document.getElementById('toggle-dict-btn');
const mainContainer = document.querySelector('.container');

if (toggleDictBtn && mainContainer) {
  toggleDictBtn.addEventListener('click', () => {
    mainContainer.classList.toggle('active');
  });
}
