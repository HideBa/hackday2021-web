<template>
  <button @click="getTodaysMessage">Today's diary</button>
</template>

<script>
import { defineComponent } from "vue";
import { reactive } from "@vue/reactivity";

export default defineComponent({
  props: {
    // getTodaysMessage: Function
  },
  emits: ["getTodaysMessage"],
  setup(props, { emit }) {
    const todaysMessage = reactive({
      messages: [],
    });
    const getTodaysMessage = () => {
      todaysMessage.messages = emit("getTodaysMessage");
      console.log("messages--------", todaysMessage.messages);
    };
    return {
      getTodaysMessage,
    };
  },
});
</script>
