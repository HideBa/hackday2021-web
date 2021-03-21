import { createRouter, createWebHistory } from "vue-router";
import Summary from "../Summary.vue";
import Message from "../Message.vue";

const routes = [
  {
    path: "/",
    name: "Message",
    component: Message,
  },
  {
    path: "/summary",
    name: "Summary",
    component: Summary,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
