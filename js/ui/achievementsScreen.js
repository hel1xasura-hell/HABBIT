/**
 * achievementsScreen.js — Milestone badges
 */

async function renderAchievements() {
  const habits = await Habits.listHabits();
  if (!habits.length) return `<div class="screen"><div class="empty-state"><div class="emoji">🎯</div><p>Add a habit first from the Dashboard.</p></div></div>`;
  const activeId = Habits.getSelectedHabitId() || habits[0].id;
  await Habits.checkAndUnlockAchievements(activeId);
  const unlocked = await Habits.getAchievementsForHabit(activeId);
  const unlockedMap = new Map(unlocked.map((a) => [a.milestone, a]));

  return `
    <div class="topbar"><div><div class="eyebrow">Milestones</div><h1>Achievements</h1></div></div>
    <div class="screen">
      ${await Components.renderHabitStrip(activeId)}

      <div class="motivation-banner"><span style="font-size:20px;">🏅</span><span>${unlocked.length} of ${Habits.MILESTONES.length} badges unlocked</span></div>

      <div class="badge-grid">
        ${Habits.MILESTONES.map((m) => {
          const isUnlocked = unlockedMap.has(m);
          return `
            <div class="badge ${isUnlocked ? 'unlocked' : ''}">
              <div class="b-icon">${Habits.MILESTONE_ICONS[m]}</div>
              <div class="b-label">${Habits.MILESTONE_LABELS[m]}</div>
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

window.AchievementsScreen = { renderAchievements };
          
