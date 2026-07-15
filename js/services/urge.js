/**
 * urge.js — Urge event logging + static supportive content
 */

const MOTIVATIONAL_MESSAGES = [
  'This feeling is a wave. Waves rise, peak, and pass — you don\'t have to do anything but ride it out.',
  'You have gotten through every urge so far. That is a perfect record. Keep it going.',
  'The urge is loud right now, but it is temporary. Your reasons for quitting are permanent.',
  'Breathe. You are not your craving — you are the one noticing it.',
  'Every minute you wait is a minute closer to this passing completely.',
  'Future you is proud of what you are doing right now, even if it is hard.',
  'You already made the hard decision once. This is just holding the line for a few more minutes.',
  'Discomfort now is the price of freedom later. It is worth it.',
];

const DISTRACTION_IDEAS = [
  { icon: '🚶', text: 'Take a brisk 5-minute walk outside or around the room' },
  { icon: '💧', text: 'Drink a full glass of water, slowly' },
  { icon: '🧘', text: 'Do a 2-minute guided meditation or body scan' },
  { icon: '🎧', text: 'Put on one upbeat song and really listen to it' },
  { icon: '✍️', text: 'Write down exactly what you are feeling right now' },
  { icon: '🤸', text: 'Do 20 jumping jacks or push-ups to reset your energy' },
  { icon: '📞', text: 'Text or call someone who supports your goal' },
  { icon: '🧊', text: 'Splash cold water on your face' },
  { icon: '🌬️', text: 'Step outside for fresh air, even just for a minute' },
  { icon: '🧩', text: 'Occupy your hands: doodle, stretch, tidy a small space' },
];

function randomMessage() {
  return MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
}

function randomDistractions(count = 4) {
  const shuffled = [...DISTRACTION_IDEAS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function logUrge({ habitId, resolved, durationSeconds }) {
  const record = {
    id: DB.makeId('urge'),
    habitId,
    timestamp: new Date().toISOString(),
    resolved, // 'yes' | 'no'
    durationSeconds,
  };
  await DB.put('urges', record);
  return record;
}

async function listUrgesForHabit(habitId) {
  const rows = await DB.query('urges', 'habitId', habitId);
  return rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

window.Urge = { MOTIVATIONAL_MESSAGES, DISTRACTION_IDEAS, randomMessage, randomDistractions, logUrge, listUrgesForHabit };
