// Assemble final HTML by replacing __PATTERNS__, __TOPICS__, __COMPANIES__, __APTITUDE__ placeholders
const fs = require('fs');
const path = require('path');

const SCRIPTS_DIR = __dirname;
const OUTPUT_PATH = path.join(__dirname, '../download/placement_tracker.html');

const shell = fs.readFileSync(path.join(SCRIPTS_DIR, 'shell.html'), 'utf8');
const patterns = fs.readFileSync(path.join(SCRIPTS_DIR, 'data-patterns.json'), 'utf8');
const topics = fs.readFileSync(path.join(SCRIPTS_DIR, 'data-topics.json'), 'utf8');
const companies = fs.readFileSync(path.join(SCRIPTS_DIR, 'data-companies.json'), 'utf8');
const aptitude = fs.readFileSync(path.join(SCRIPTS_DIR, 'data-aptitude.json'), 'utf8');

let html = shell
  .replace('__PATTERNS__', patterns)
  .replace('__TOPICS__', topics)
  .replace('__COMPANIES__', companies)
  .replace('__APTITUDE__', aptitude);

fs.writeFileSync(OUTPUT_PATH, html);

const stats = {
  size: (fs.statSync(OUTPUT_PATH).size / 1024).toFixed(1) + ' KB',
  patterns: Object.keys(JSON.parse(patterns)).length,
  topics: Object.keys(JSON.parse(topics)).length,
  topicProblems: Object.values(JSON.parse(topics)).reduce((a,t)=>a+t.problems.length,0),
  companies: Object.keys(JSON.parse(companies)).length,
  companyProblems: Object.values(JSON.parse(companies)).reduce((a,c)=>a+c.problems.length,0)
};
console.log('Assembled:', OUTPUT_PATH);
console.log('Stats:', JSON.stringify(stats, null, 2));
