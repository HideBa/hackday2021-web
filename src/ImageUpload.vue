<template>
  <!-- <v-icon>fas fa-search</v-icon> -->
  <!-- <img src="<%= BASE_URL %>image.png" /> -->
  <input type="file" @change="onFileChange" />
  <img src="testRef" alt="" />
  <!-- <vue-core-image-upload ></vue-core-image-upload> -->
</template>

<script>
import { defineComponent, ref } from "vue";
import firebase from "firebase";
import { storage } from "./firebase";
// import VueCoreImageUpload from "vue-core-image-uplad";
// import VIcon from "vuetify";

export default defineComponent({
  setup() {
    const storageRef = storage.ref();
    const imageRef = storageRef.child("public");
    const testRef = storageRef.child("public/hackday2021.png").fullPath;
    console.log(imageRef);

    const uploadedImages = ref();

    const onFileChange = (e) => {
      const files = e.target.files || e.dataTransfer.files;
      console.log("files-----", files);
      //TODO:
      //1. must be refactored and enable to upload multipe files
      //2. must change auth settings in firebase storage bucket
      const uploadTask = storage
        .ref(`/images/${files[0].name}`)
        .put(files[0])
        .then((snapshot) => {
          console.log("snapshot ------", snapshot);
          console.log("uploaded image!!!");
        })
        .catch((err) => console.error(err));
    };
    return {
      onFileChange,
      testRef,
    };
  },
});
</script>
