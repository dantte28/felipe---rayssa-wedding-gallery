function doPost(e) {
  try {
    var folder = DriveApp.getFolderById("1hji0j-t4TA1qZ5gJ7kCmAyTq9drSeWWn");
    
    // Verifica se "e" tem conteudo
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Nenhum dado recebido no postData.contents");
    }

    var data = JSON.parse(e.postData.contents);

    var imageData = Utilities.base64Decode(data.image);
    var blob = Utilities.newBlob(imageData, data.mimeType, data.filename);

    var file = folder.createFile(blob);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success",
        url: file.getUrl()
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Isso vai forcar o erro a aparecer na lista de Execuções!
    console.error("ERRO NO DOPOST: " + error.toString()); 
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var folder = DriveApp.getFolderById("1hji0j-t4TA1qZ5gJ7kCmAyTq9drSeWWn");
    var files = folder.getFiles();
    var photos = [];
    
    while (files.hasNext()) {
      var file = files.next();
      if (file.getMimeType().indexOf('image/') !== -1) {
        var urlId = file.getId();
        var displayUrl = "https://drive.google.com/uc?export=view&id=" + urlId;
        
        photos.push({
          url: displayUrl,
          name: file.getName(),
          date: file.getDateCreated().getTime()
        });
      }
    }
    
    photos.sort((a, b) => b.date - a.date);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      photos: photos 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error("ERRO NO DOGET: " + error.toString()); 
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      photos: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
