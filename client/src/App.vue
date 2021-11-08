<template>
  <div class="app">
    <div class="block">
      <span class="header">Chess</span>
    </div>

    <div class="block">
      <v-game />
    </div>
  </div>
</template>

<script>
import VGame from '@/components/game/VGame.vue';

export default {
  name: 'App',

  components: { VGame },

  data() {
    return {
    };
  },

  created() {
    // this.$socket.on('add', (ev) => {
    //   console.log('ev', ev);
    // });
  },
};
</script>

<style lang="scss">
@import 'assets/style/bootstrap.scss';

html {
  user-select: none;
}
</style>
