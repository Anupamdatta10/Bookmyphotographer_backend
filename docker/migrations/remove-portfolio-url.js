const collections = db.getCollectionNames();

for (const collectionName of ['users', 'photographers']) {
  if (!collections.includes(collectionName)) continue;

  const result = db.getCollection(collectionName).updateMany(
    { portfolioUrl: { $exists: true } },
    { $unset: { portfolioUrl: '' } },
  );

  print(`${collectionName}: removed portfolioUrl from ${result.modifiedCount} document(s)`);
}
