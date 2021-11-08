<template>
  <div @click="onClick">
    <svg
      ref="svg"
      :width="size.x"
      :height="size.y"
      :viewBox="`0 0 ${fullViewBoxSize} ${fullViewBoxSize}`"
      style="background-color: #ccc; pointer-events: none"
    >
      <v-game-grid
        :game-size="gameSize"
        :view-box-size="viewBoxSize"
        :view-box-offset="viewBoxOffset"
      />

      <use
        v-for="figure in figures"
        :key="`figure_${figure.position.x}_${figure.position.y}`"
        v-bind="getFigureBinds(figure)"
        class="drop-shadow"
      ></use>

      <circle
        v-for="position in allowPositions.move"
        :key="`allow_move_${position.x}_${position.y}`"
        :cx="position.x * cellSize + viewBoxOffset + cellSize / 2"
        :cy="position.y * cellSize + viewBoxOffset + cellSize / 2"
        :r="cellSize * 0.15"
        fill="#fc0"
        class="drop-shadow"
      ></circle>

      <circle
        v-for="position in allowPositions.kill"
        :key="`allow_kill_${position.x}_${position.y}`"
        :cx="position.x * cellSize + viewBoxOffset + cellSize / 2"
        :cy="position.y * cellSize + viewBoxOffset + cellSize / 2"
        :r="cellSize * 0.15"
        fill="#f00"
        class="drop-shadow"
      ></circle>

      <rect
        v-if="selectedFigure"
        :x="selectedFigure.position.x * cellSize + viewBoxOffset"
        :y="selectedFigure.position.y * cellSize + viewBoxOffset"
        :width="cellSize"
        :height="cellSize"
        stroke="red"
        fill="transparent"
      ></rect>
    </svg>
  </div>
</template>

<script>
import VGameGrid from '@/components/game/VGameGrid.vue';

import Position from '@/model/Position';

const startPositionsFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/* eslint-disable no-continue */
const parseFEN = (s) => {
  const result = [];

  const position = new Position(0, 0);

  for (let i = 0; i < s.length; i++) {
    if (s[i] === ' ') break;

    if (s[i] === '/') {
      position.x = 0;
      position.y++;
      continue;
    }

    if (/\d/.test(s[i])) {
      position.x += Number(s[i]);
      continue;
    }

    result.push({
      sideKey: s[i].toUpperCase() === s[i] ? 'W' : 'B',
      figureKey: s[i].toUpperCase(),
      position: Position.clone(position),
    });

    position.x++;
  }

  return result;
};
/* eslint-enable no-continue */

const figureMap = {
  K: { key: 'K', name: 'king', title: 'King' },
  Q: { key: 'Q', name: 'queen', title: 'Queen' },
  R: { key: 'R', name: 'rook', title: 'Rook' },
  N: { key: 'N', name: 'knight', title: 'Knight' },
  B: { key: 'B', name: 'bishop', title: 'Bishop' },
  P: { key: 'P', name: 'pawn', title: 'Pawn' },
};

const sideMap = {
  W: { key: 'W', name: 'w' },
  B: { key: 'B', name: 'b' },
};

const defaultFigures = parseFEN(startPositionsFEN);

export default {
  name: 'VGame',

  components: { VGameGrid },

  props: {
    size: { type: Object, default: () => ({ x: 800, y: 800 }) },
    gameSize: { type: Number, default: 8 },

    viewBoxSize: { type: Number, default: 256 },
    viewBoxOffset: { type: Number, default: 16 },
  },

  data() {
    return {
      figures: defaultFigures,

      selectedFigure: null,
      allowPositions: {
        move: [],
        kill: [],
      },
    };
  },

  computed: {
    cellSize() {
      return this.viewBoxSize / this.gameSize;
    },

    fullViewBoxSize() {
      return this.viewBoxSize + this.viewBoxOffset * 2;
    },
  },

  methods: {
    onClick(ev) {
      const position = new Position(
        Math.floor(((ev.offsetX / this.size.x) * this.fullViewBoxSize - this.viewBoxOffset) / this.cellSize),
        Math.floor(((ev.offsetY / this.size.y) * this.fullViewBoxSize - this.viewBoxOffset) / this.cellSize),
      );

      const clickedFigure = this.figures
        .find((figure) => figure.position.isEqual(position));

      if (this.allowPositions.kill.some((p) => p.isEqual(position))) {
        this.figures = this.figures.filter((f) => !f.position.isEqual(position));
        this.selectedFigure.position = position;
        this.clearSelection();
        return;
      }

      if (clickedFigure) {
        this.selectedFigure = clickedFigure;

        this.allowPositions = this.figureMoveNKillFactory(this.selectedFigure, this.figures, this.gameSize);
      } else if (this.allowPositions.move.some((p) => p.isEqual(position))) {
        this.selectedFigure.position = position;
        this.clearSelection();
      } else {
        this.clearSelection();
      }
    },

    getFigureBinds(figure) {
      const sideName = sideMap[figure.sideKey].name;
      const figureName = figureMap[figure.figureKey].name;

      const k = this.cellSize * 0.9;

      return {
        x: figure.position.x * this.cellSize + this.viewBoxOffset + (this.cellSize - k) / 2,
        y: figure.position.y * this.cellSize + this.viewBoxOffset + (this.cellSize - k) / 2,
        width: k,
        height: k,
        href: `/figures/${sideName}-${figureName}.icon.svg#${sideName}-${figureName}`,
      };
    },

    clearSelection() {
      this.selectedFigure = null;
      this.allowPositions = { move: [], kill: [] };
    },

    figureMoveNKillFactory(figure, figures, gameSize) {
      const beamMovePositions = (point, ox, oy) => {
        const pos = new Position(point.x + ox, point.y + oy);
        if (
          (pos.x >= 0 && pos.x < gameSize)
          && (pos.y >= 0 && pos.y < gameSize)
          && figures.every((f) => !f.position.isEqual(pos))
        ) return [pos, ...beamMovePositions(pos, ox, oy)];
        return [];
      };

      const beamKillPositions = (point, ox, oy, alliedSideKey) => {
        const pos = new Position(point.x + ox, point.y + oy);
        if (
          (pos.x >= 0 && pos.x < gameSize)
          && (pos.y >= 0 && pos.y < gameSize)
        ) {
          if (figures.some((f) => f.position.isEqual(pos) && f.sideKey !== alliedSideKey)) return [pos];
          if (!figures
            .some((f) => f.sideKey === alliedSideKey && f.position.isEqual(pos))
          ) return beamKillPositions(pos, ox, oy, alliedSideKey);
        }
        return [];
      };

      const map = {
        K: (_figure) => {
          const move = [];
          const kill = [];
          for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
              const resPosition = new Position(_figure.position.x + x, _figure.position.y + y);

              if (
                (x !== 0 || y !== 0)
                && (resPosition.x >= 0 && resPosition.x < gameSize)
                && (resPosition.y >= 0 && resPosition.y < gameSize)
                && figures.every((f) => !f.position.isEqual(resPosition))
              ) move.push(resPosition);

              if (figures
                .some((f) => f.sideKey !== _figure.sideKey && f.position.isEqual(resPosition))
              ) kill.push(resPosition);
            }
          }
          return { move, kill };
        },
        Q: (_figure) => {
          const move = [
            ...beamMovePositions(_figure.position, -1, 1),
            ...beamMovePositions(_figure.position, 1, 1),
            ...beamMovePositions(_figure.position, -1, -1),
            ...beamMovePositions(_figure.position, 1, -1),
            ...beamMovePositions(_figure.position, 1, 0),
            ...beamMovePositions(_figure.position, -1, 0),
            ...beamMovePositions(_figure.position, 0, 1),
            ...beamMovePositions(_figure.position, 0, -1),
          ];
          const kill = [
            ...beamKillPositions(_figure.position, -1, 1, _figure.sideKey),
            ...beamKillPositions(_figure.position, 1, 1, _figure.sideKey),
            ...beamKillPositions(_figure.position, -1, -1, _figure.sideKey),
            ...beamKillPositions(_figure.position, 1, -1, _figure.sideKey),
            ...beamKillPositions(_figure.position, 1, 0, _figure.sideKey),
            ...beamKillPositions(_figure.position, -1, 0, _figure.sideKey),
            ...beamKillPositions(_figure.position, 0, 1, _figure.sideKey),
            ...beamKillPositions(_figure.position, 0, -1, _figure.sideKey),
          ];
          return { move, kill };
        },
        R: (_figure) => {
          const move = [
            ...beamMovePositions(_figure.position, 1, 0),
            ...beamMovePositions(_figure.position, -1, 0),
            ...beamMovePositions(_figure.position, 0, 1),
            ...beamMovePositions(_figure.position, 0, -1),
          ];
          const kill = [
            ...beamKillPositions(_figure.position, 1, 0, _figure.sideKey),
            ...beamKillPositions(_figure.position, -1, 0, _figure.sideKey),
            ...beamKillPositions(_figure.position, 0, 1, _figure.sideKey),
            ...beamKillPositions(_figure.position, 0, -1, _figure.sideKey),
          ];
          return { move, kill };
        },
        N: (_figure) => {
          const allow = [
            _figure.position.getMoved(1, 2),
            _figure.position.getMoved(1, -2),
            _figure.position.getMoved(-1, 2),
            _figure.position.getMoved(-1, -2),
            _figure.position.getMoved(2, 1),
            _figure.position.getMoved(-2, 1),
            _figure.position.getMoved(2, -1),
            _figure.position.getMoved(-2, -1),
          ].filter((p) => (p.x >= 0 && p.x < gameSize)
            && (p.y >= 0 && p.y < gameSize));
          return {
            move: allow.filter((p) => figures.every((f) => !f.position.isEqual(p))),
            kill: allow.filter((p) => figures.some((f) => f.position.isEqual(p) && f.sideKey !== _figure.sideKey)),
          };
        },
        B: (_figure) => {
          const move = [
            ...beamMovePositions(_figure.position, -1, 1),
            ...beamMovePositions(_figure.position, 1, 1),
            ...beamMovePositions(_figure.position, -1, -1),
            ...beamMovePositions(_figure.position, 1, -1),
          ];
          const kill = [
            ...beamKillPositions(_figure.position, -1, 1, _figure.sideKey),
            ...beamKillPositions(_figure.position, 1, 1, _figure.sideKey),
            ...beamKillPositions(_figure.position, -1, -1, _figure.sideKey),
            ...beamKillPositions(_figure.position, 1, -1, _figure.sideKey),
          ];
          return { move, kill };
        },
        P: (_figure) => {
          const move = (
            sideMap[_figure.sideKey].name === 'w'
              ? [
                _figure.position.getMoved(0, -1),
                ...(_figure.position.y === 6 ? [_figure.position.getMoved(0, -2)] : []),
              ]
              : [
                _figure.position.getMoved(0, 1),
                ...(_figure.position.y === 1 ? [_figure.position.getMoved(0, 2)] : []),
              ]
          )
            .filter((p) => (p.x >= 0 && p.x < gameSize)
              && (p.y >= 0 && p.y < gameSize)
              && figures.every((f) => !f.position.isEqual(p)));
          return { move, kill: [] };
        },
      };

      const enemyFigures = this.figures.filter((f) => f.sideKey !== figure.sideKey);
      const kill = [];
      enemyFigures.forEach((ef) => kill.push(...map[ef.figureKey](ef).kill));

      const alliedKing = figures.find((f) => f.figureKey === 'K' && f.sideKey === figure.sideKey);

      if (kill.some((p) => p.isEqual(alliedKing.position))) return { move: [], kill: [] };

      // const result = map[figure.figureKey](figure);
      // result.kill = result.kill.filter((p) => !figures.some((f) => f.position.isEqual(p) && f.figureKey === 'K'));
      // return result;

      return map[figure.figureKey](figure);
    },
  },
};
</script>

<style lang="scss" scoped>
.drop-shadow {
  filter: drop-shadow(0 1px 2px #0009);
}
</style>
