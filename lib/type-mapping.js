// Mapping internal types to external types (plurals first!)
const inToExMap = {
  objects: 'objects',
  object: 'objects',
  agents: 'people',
  agent: 'people',
  archives: 'documents',
  archive: 'documents'
};

const inToExRegx = new RegExp('(' + Object.keys(inToExMap).join('|') + ')');

exports.toExternal = (type) => (type + '').replace(inToExRegx, (match) => inToExMap[match]);
