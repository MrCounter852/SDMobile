export const formatTime = (milliseconds) => {
  if (!milliseconds) return "0:00";
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const getTipoMensaje = (mimeType) => {
  if (!mimeType) return null;
  const ext = mimeType.split('/')[1]?.toLowerCase();
  const documentExtensions = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'xml', 'zip', '7z', 'rar'];
  const imageExtensions = ['png', 'jpg', 'gif', 'jpeg', 'webp'];
  
  if (documentExtensions.includes(ext)) return "document";
  if (imageExtensions.includes(ext)) return "image";
  if (ext === 'mp4') return "video";
  if (ext === 'mp3') return "audio";
  return null;
};

export const formatMessagesForChat = (apiMessages, contact, user) => {
  const formattedMessages = [];
  for (const msg of apiMessages) {
    const formattedMsg = {
      _id: msg.CuentaMensajeriaMensajeID,
      text: msg.Texto || "",
      createdAt: new Date(msg.Fecha),
      user: {
        _id: msg.Recepcion ? 2 : 1,
        name: msg.Recepcion ? contact?.Nombre : user?.NombreCompleto,
      },
      sent: msg.Status === "sent",
      delivered: msg.Status === "delivered",
      read: msg.Status === "read",
    };

    if (msg.TipoMensaje === "document") {
      if (msg.HttpUrl) {
        formattedMsg.file = { name: msg.FileName, url: msg.HttpUrl };
      } else if (msg.FileID) {
        formattedMsg.pendingMedia = {
          type: 'file',
          params: {
            MediaID: msg.FileID,
            AccessToken: contact.AccessToken,
            FileMime: msg.FileMime
          },
          name: msg.FileName
        };
      }
    } else if (msg.FileID && (msg.TipoMensaje === "image" || msg.TipoMensaje === "sticker")) {
      formattedMsg.pendingMedia = {
        type: 'image',
        params: {
          MediaID: msg.FileID,
          AccessToken: contact.AccessToken,
          FileMime: msg.FileMime
        }
      };
    } else if (msg.HttpUrl && (msg.TipoMensaje === "image" || msg.TipoMensaje === "sticker")) {
      formattedMsg.image = msg.HttpUrl;
    }
    
    if (msg.TipoMensaje === "video") {
      if (msg.FileID) {
        formattedMsg.pendingMedia = {
          type: 'video',
          params: {
            MediaID: msg.FileID,
            AccessToken: contact.AccessToken,
            FileMime: msg.FileMime
          }
        };
      } else if (msg.HttpUrl) {
        formattedMsg.video = msg.HttpUrl;
      }
    }
    
    if (msg.TipoMensaje === "audio") {
      if (msg.FileID) {
        formattedMsg.pendingMedia = {
          type: 'audio',
          params: {
            MediaID: msg.FileID,
            AccessToken: contact.AccessToken,
            FileMime: msg.FileMime
          }
        };
      } else if (msg.HttpUrl) {
        formattedMsg.audio = msg.HttpUrl;
      }
    }

    formattedMessages.push(formattedMsg);
  }
  return formattedMessages;
};
