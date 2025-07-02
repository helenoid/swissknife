// Stub for nanoid module to provide CommonJS compatible exports
module.exports = {
  nanoid: function(size = 21) {
    // Simple stub that generates random IDs
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < size; i++) {
      result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return result;
  }
};
