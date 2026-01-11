export const triggerRebuild = async () => { const { rebuildGlobalCache } = require('./index'); await rebuildGlobalCache(); }; triggerRebuild();
