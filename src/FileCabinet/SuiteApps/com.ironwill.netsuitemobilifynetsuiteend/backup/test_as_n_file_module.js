/**
 *@NApiVersion 2.1
 *
 */

define(["N/file"], (file) => {
  function someExampleOfFile() {
    const testFile = file.create({
      name: "test.txt",
      fileType: file.Type.PLAINTEXT,
      content: "hello from node js",
      folder: 123,
    });

    const fileId = testFile.save();

    const testFileCSV = file.create({
      name: "test.csv",
      fileType: file.Type.CSV,
      content: "id, name, email \n 1, alex, alex@a.com \n 2, al,a@a.com",
      folder: 123,
    });

    const csvFile = testFile.save();

    const loadedFile = file.load({
      id: "fileId",
    });

    log.debug("Name", loadedFile.name);
    log.debug("Size", loadedFile.size);
    log.debug("URL", loadedFile.url);
    log.debug("Folder", loadedFile.folder);

    const loadedFilefromPath = file.load({
      id: "SuiteScripts/test/customer.txt",
    });

    const entireContents = loadedFilefromPath.getContents();

    csvFile
      .getContents()
      .lines.iterator()
      .each((line) => {
        log.debug({
          title: "line",
          details: line,
        });

        return true;
      });

    csvFile.appendLine({
      value: "shgdc,sdgi,sdg",
    });

    csvFile.save();

    file.copy({
      id: 123,
      folder: 456,
      conflictResolution: file.NameConflictResolution.RENAME_TO_UNIQUE,
    });

    const movedFile = file.move({
      id: 456,
      folder: 789,
      conflictResolution: file.NameConflictResolution.RENAME_TO_UNIQUE,
    });
  }
  return {
    someExampleOfFile: someExampleOfFile,
  };
});
