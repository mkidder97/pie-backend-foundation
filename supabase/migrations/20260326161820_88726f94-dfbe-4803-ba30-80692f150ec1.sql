UPDATE pie_creators SET active = false
WHERE name IN (
  'The Verge AI',
  'MIT Technology Review AI',
  'Federal Reserve News',
  'First Round Review',
  'Real Vision',
  'One Useful Thing',
  'Google DeepMind Blog',
  'OpenAI Blog'
);