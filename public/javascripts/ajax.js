function sendAjaxQuery(url, data) {
    that.$axios
        .post("../uploadImg", {
            name: name,
            author: author,
            title: title,
            base64: imgcode
        })
        .then(res => {
            console.log("The picture has been uploaded successfully!");
        });
}
console.log()