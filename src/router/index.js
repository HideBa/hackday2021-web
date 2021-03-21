import { createRouter, createWebHistory } from "vue-router";
import App from "../App.vue";
import Summary from "../Summary.vue";

const routes = [
  {
    path: "/",
    name: "Message",
    component: App,
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
