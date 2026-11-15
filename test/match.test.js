// Run: node test/match.test.js
const assert = require('node:assert/strict');
const { entryMatchesUrl: m } = require('../src/match.js');

assert(m('youtube.com', 'https://youtube.com/'));
assert(m('youtube.com', 'https://www.youtube.com/watch?v=1'));
assert(m('YouTube.com', 'https://youtube.com:8080/x'));
assert(!m('youtube.com', 'https://music.youtube.com/'));
assert(!m('youtube.com', 'https://example.com/?u=youtube.com'));
assert(!m('youtube.com', 'https://notyoutube.com/'));
assert(!m('reddit', 'https://www.reddit.com/')); // bare words no longer match
assert(m('https://youtube.com/', 'https://www.youtube.com/'));
assert(m('http://www.youtube.com', 'https://youtube.com/x'));
assert(m('www.youtube.com', 'https://youtube.com/'));
assert(m('youtube.com/shorts', 'https://www.youtube.com/shorts/abc'));
assert(m('youtube.com/shorts/', 'https://youtube.com/shorts'));
assert(!m('youtube.com/shorts', 'https://youtube.com/shortsfoo'));
assert(!m('youtube.com/shorts', 'https://youtube.com/watch'));
assert(m('youtube.com/shorts?x=1#y', 'https://youtube.com/shorts/a'));
assert(!m('', 'https://youtube.com/'));
assert(!m('  ', 'https://youtube.com/'));
assert(!m('youtube.com', 'not a url'));
console.log('ok');
