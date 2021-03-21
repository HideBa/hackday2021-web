<template>
  <input type="file" @change="onFileChange" />
</template>

<script>
import { defineComponent } from "vue";
import { storage } from "./firebase";

export default defineComponent({
  emits: ["sendImageUrl"],
  setup(props, { emit }) {
    const sendImageUrl = (imagePath) => {
      emit("sendImageUrl", imagePath);
    };

    const onFileChange = (e) => {
      const files = e.target.files || e.dataTransfer.files;
      //TODO:
      //1. must be refactored and enable to upload multipe files
      //2. must change auth settings in firebase storage bucket
      const uploadTask = storage.ref(`/images/${files[0].name}`).put(files[0]);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("upload is" + progress + "% done");
        },
        (error) => console.error(error),
        () => {
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            sendImageUrl(downloadURL);
          });
        }
      );
    };
    return {
      onFileChange,
    };
  },
});
</script>
