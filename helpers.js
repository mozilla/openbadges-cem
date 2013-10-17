function splitDescriptions(badge) {
  if (badge) {
    var descriptions = badge.description.split('*', 2);

    badge.shortDescription = descriptions[0];
    badge.description = descriptions[1];
  }

  return badge;
}

function splitProgramDescriptions(data) {
  if (data && data.program) {
    for (var shortname in data.program.earnableBadges) {
      data.program.earnableBadges[shortname] = splitDescriptions(data.program.earnableBadges[shortname]);
    }
  }

  return data;
}

module.exports = {
  splitDescriptions: splitDescriptions,
  splitProgramDescriptions: splitProgramDescriptions
};
