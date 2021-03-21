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
  width: 250px;
  height: auto;
}
</style>
