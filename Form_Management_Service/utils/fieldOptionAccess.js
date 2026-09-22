const FieldOption = require('../models/FieldOption');

const canShareTemplates = (user) => (
  user?.role === 'admin' || user?.workspaceRole === 'owner' || user?.workspaceRole === 'admin'
);

const sameId = (left, right) => Boolean(left) && Boolean(right) && String(left) === String(right);

const canEditSet = (set, user) => {
  if (!set || !user) return false;
  if (set.isTemplate) return canShareTemplates(user);
  return sameId(set.ownerId, user._id);
};

const visibleSetsQuery = (user) => {
  if (!user?._id) return { isTemplate: true };
  return {
    $or: [
      { isTemplate: true },
      { ownerId: user._id, isTemplate: { $ne: true } }
    ]
  };
};

const findReadableSet = async (optionType, user) => {
  if (user?._id) {
    const own = await FieldOption.findOne({
      optionType,
      ownerId: user._id,
      isTemplate: { $ne: true },
      isActive: true
    });
    if (own) return own;
  }
  return FieldOption.findOne({ optionType, isTemplate: true, isActive: true });
};

const stampOwner = (user, isTemplate) => ({
  ownerId: user?._id || null,
  workspaceId: isTemplate ? null : (user?.workspaceId || null),
  isTemplate: Boolean(isTemplate)
});

module.exports = {
  canShareTemplates,
  canEditSet,
  visibleSetsQuery,
  findReadableSet,
  stampOwner
};
