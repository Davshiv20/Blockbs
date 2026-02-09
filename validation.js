// Heuristic validation for barrier reasons
function validateReason(text) {
  const errors = [];
  const trimmed = text.trim();

  // Check 1: Minimum length
  if (trimmed.length < 30) {
    return { valid: false, errors: ['Please write at least 30 characters'] };
  }

  // Determine if text is predominantly non-Latin
  const nonLatinChars = (trimmed.match(/[^\u0000-\u024F\s\d.,!?;:'"()\-]/g) || []).length;
  const isNonLatin = nonLatinChars / trimmed.length > 0.5;

  // Check 2: Repeated characters — any char repeated 4+ in a row, or single char >40% of text
  if (/(.)\1{3,}/.test(trimmed)) {
    errors.push('Avoid repeating the same character');
    return { valid: false, errors };
  }
  const charFreq = {};
  for (const ch of trimmed.toLowerCase().replace(/\s/g, '')) {
    charFreq[ch] = (charFreq[ch] || 0) + 1;
  }
  const strippedLen = trimmed.replace(/\s/g, '').length;
  if (strippedLen > 0) {
    for (const ch in charFreq) {
      if (charFreq[ch] / strippedLen > 0.4) {
        errors.push('Avoid repeating the same character');
        return { valid: false, errors };
      }
    }
  }

  // For non-Latin text, only checks 1 and 2 apply
  if (isNonLatin) {
    return { valid: true, errors: [] };
  }

  // Strip URLs before word-quality checks
  const textNoUrls = trimmed.replace(/https?:\/\/\S+/gi, '').trim();
  const words = textNoUrls.toLowerCase().split(/\s+/).filter(w => w.length > 0);

  if (words.length === 0) {
    return { valid: false, errors: ['Please explain in your own words, not just a link'] };
  }

  // Check 3: Repeated words — non-stopword appears >3 times AND >30% of total
  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'is', 'it', 'my', 'i', 'me', 'we', 'you', 'he', 'she', 'they',
    'this', 'that', 'was', 'are', 'be', 'been', 'have', 'has', 'had', 'do',
    'does', 'did', 'will', 'would', 'could', 'should', 'not', 'with', 'from',
    'by', 'as', 'so', 'if', 'up', 'out', 'no', 'just', 'about', 'into',
    'than', 'then', 'can', 'some', 'what', 'when', 'who', 'how', 'all',
    'there', 'their', 'its', 'am', 'were', 'being', 'here', 'very', 'need',
    'want', 'because', 'going'
  ]);
  const wordCounts = {};
  for (const w of words) {
    if (!stopwords.has(w)) {
      wordCounts[w] = (wordCounts[w] || 0) + 1;
    }
  }
  for (const w in wordCounts) {
    if (wordCounts[w] > 3 && wordCounts[w] / words.length > 0.3) {
      errors.push('Try to vary your words instead of repeating');
      return { valid: false, errors };
    }
  }

  // Check 4: Keyboard mashing — sliding 5-char windows against known sequences
  const sequences = [
    'qwert', 'werty', 'ertyu', 'rtyui', 'tyuio', 'yuiop',
    'asdfg', 'sdfgh', 'dfghj', 'fghjk', 'ghjkl',
    'zxcvb', 'xcvbn', 'cvbnm',
    'qwert'.split('').reverse().join(''),
    'asdfg'.split('').reverse().join(''),
    'zxcvb'.split('').reverse().join(''),
    '12345', '23456', '34567', '45678', '56789', '67890',
  ];
  const lowerNospaces = trimmed.toLowerCase().replace(/\s+/g, '');
  if (lowerNospaces.length >= 5) {
    let mashCount = 0;
    const totalWindows = lowerNospaces.length - 4;
    for (let i = 0; i <= lowerNospaces.length - 5; i++) {
      const window = lowerNospaces.substring(i, i + 5);
      if (sequences.includes(window)) {
        mashCount++;
      }
    }
    if (totalWindows > 0 && mashCount / totalWindows > 0.3) {
      errors.push('That looks like keyboard mashing, not a real reason');
      return { valid: false, errors };
    }
  }

  // Check 5: Real words — words of 4+ chars should have vowels, no 5+ consecutive consonants
  const longWords = words.filter(w => w.replace(/[^a-z]/g, '').length >= 4);
  if (longWords.length > 0) {
    let badWordCount = 0;
    for (const w of longWords) {
      const alpha = w.replace(/[^a-z]/g, '');
      const hasVowel = /[aeiouy]/.test(alpha);
      const hasLongConsonants = /[^aeiouy]{5,}/.test(alpha);
      if (!hasVowel || hasLongConsonants) {
        badWordCount++;
      }
    }
    if (badWordCount / longWords.length > 0.5) {
      errors.push('Your reason should contain real words');
      return { valid: false, errors };
    }
  }

  // Check 6: Word diversity — with 5+ words, unique/total must be >= 0.4
  if (words.length >= 5) {
    const uniqueWords = new Set(words).size;
    if (uniqueWords / words.length < 0.4) {
      errors.push('Please write a more varied explanation');
      return { valid: false, errors };
    }
  }

  return { valid: true, errors: [] };
}
