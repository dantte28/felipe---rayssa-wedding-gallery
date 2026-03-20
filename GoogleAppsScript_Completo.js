var FOLDER_ID = '1hji0j-t4TA1qZ5gJ7kCmAyTq9drSeWWn';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var folder = DriveApp.getFolderById(FOLDER_ID);
    
    var imageData = Utilities.base64Decode(data.image);
    var nomeDoArquivo = data.name + ' - ' + data.filename;
    var blob = Utilities.newBlob(imageData, data.mimeType, nomeDoArquivo);
    var file = folder.createFile(blob);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      fileUrl: file.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var folder = DriveApp.getFolderById(FOLDER_ID);
    var files = folder.getFiles();
    var result = [];
    
    while (files.hasNext()) {
      var file = files.next();
      
      // Limpar o nome para exibição na galeria (remover sufixo de arquivo se desejar)
      var nomeAutor = file.getName().split(' - ')[0] || "Convidado";
      
      result.push({
        url: "https://drive.google.com/uc?export=view&id=" + file.getId(),
        name: nomeAutor
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      photos: result 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
