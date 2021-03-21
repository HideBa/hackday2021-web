<template>
  <div class="image-card">
    <img :src="imagePath" />
  </div>
</template>

<script>
export default {
  props: {
    imagePath: String,
  },
};
</script>

<style scoped>
.image-card {
  width: 100px;
  height: 100px;
}
</style>
