<template>
  <g>
    <template v-for="x in gameSize">
      <template v-for="y in gameSize">

        <rect
          :key="`cell_${(x - 1)}_${(y - 1)}`"
          :x="(x - 1) * cellSize + viewBoxOffset"
          :y="(y - 1) * cellSize + viewBoxOffset"
          :width="cellSize"
          :height="cellSize"
          :fill="(x + y % 2) % 2 === 0 ? '#fdce9e' : '#d18b45'"
        />

      </template>
    </template>
  </g>
</template>

<script>
export default {
  name: 'VGameGrid',

  props: {
    gameSize: { type: Number, required: true },

    viewBoxSize: { type: Number, required: true },
    viewBoxOffset: { type: Number, required: true },
  },

  computed: {
    cellSize() {
      return this.viewBoxSize / this.gameSize;
    },
  },
};
</script>
