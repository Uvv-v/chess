// import io from 'socket.io-client';
import Vue from 'vue';
import App from './App.vue';

// Vue.prototype.$socket = io(process.env.VUE_APP_WS_URL);

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount('#app');
