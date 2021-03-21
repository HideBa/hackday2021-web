<template>
  <div>
    <img class="image-card" :src="imagePath" />
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
  width: 200px;
  height: 200px;
}
</style>
