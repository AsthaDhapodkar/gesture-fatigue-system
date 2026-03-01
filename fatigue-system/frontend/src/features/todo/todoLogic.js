// todoLogic.js — Pure functions only. No React.

export function createTask(text) {
  return {
    id: Date.now() + Math.random(),
    text: text.trim(),
    createdAt: Date.now(),
  };
}

export function deleteTaskFromPool(pool, taskId) {
  return pool.filter((t) => t.id !== taskId);
}

export function addTaskToActive(activeList, task) {
  if (activeList.find((t) => t.id === task.id)) return activeList;
  return [...activeList, { ...task, completed: false, dragging: false }];
}

export function removeTaskFromActive(activeList, taskId) {
  return activeList.filter((t) => t.id !== taskId);
}

export function toggleComplete(activeList, taskId) {
  return activeList.map((t) =>
    t.id === taskId ? { ...t, completed: !t.completed } : t
  );
}

export function reorderTasks(activeList, fromIndex, toIndex) {
  const list = [...activeList];
  const [moved] = list.splice(fromIndex, 1);
  list.splice(toIndex, 0, moved);
  return list;
}
