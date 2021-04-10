(function (vue) {
  'use strict';

  var script$3 = {
    name: "NumberTrio",
    props: {
      value: {
        type: String,
        required: true,
        validator(value) {
          return Boolean(value.match(/^\d+$/));
        }
      },
      position: {
        type: Number,
        required: true,
      },
      count: {
        type: Number,
        required: true,
      },
      padding: { // letterSpacing value, e.g., "5px"
        type: String
      },
    },
    computed: {
      part1() {
        return this.parts.part1;
      },
      part2() {
        return this.parts.part2;
      },
      parts() {
        const el = this.value;
        if (this.isLast) {
          return {
            part1: el,
            part2: ""
          };
        } else {
          return {
            part1: el.substring(0, el.length - 1),
            part2: el.substring(el.length - 1)
          };
        }
      },
      isLast() {
        return this.position === this.count - 1;
      }
    }
  };

  const _hoisted_1$2 = { class: "trio" };
  const _hoisted_2$1 = { key: 0 };

  function render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return (vue.openBlock(), vue.createBlock("span", _hoisted_1$2, [
      ($options.part1)
        ? (vue.openBlock(), vue.createBlock("span", _hoisted_2$1, vue.toDisplayString($options.part1), 1 /* TEXT */))
        : vue.createCommentVNode("v-if", true),
      ($options.part2)
        ? (vue.openBlock(), vue.createBlock("span", {
            key: 1,
            class: "padded",
            style: {letterSpacing: $props.padding}
          }, vue.toDisplayString($options.part2), 5 /* TEXT, STYLE */))
        : vue.createCommentVNode("v-if", true)
    ]))
  }

  script$3.render = render$3;
  script$3.__file = "components/NumberTrio.vue";

  var script$2 = {
    name: "FormattedNumber",
    props: {
      number: {
        type: Number,
        required: true,
      },
      precision: { // Count of numbers after the point (the dot), if the integer part contains 1 digit
        type: Number,
        default: 2 // result for "3": "1.123", "10.12", "100.1", "1000"; for "2": "1.01", "10", "100";
      },
      padding: {   // letterSpacing value, e.g., "5px"
        type: String,
        default: null
      }
    },
    computed: {
      /** @returns {Boolean} */
      isNegative() {
        return this.parts.isNegative;
      },
      /** @returns {String} */
      integer() {
        return this.parts.integer;
      },
      /** @returns {String} */
      decimal() {
        return this.parts.decimal;
      },
      parts() {
        const [integer, decimal] = this.number.toString().split(".");
        const isNegative = this.number < 0;
        return {
          isNegative,
          integer: isNegative ? integer.substring(1) : integer,
          decimal
        };
      },
      decimalTrimmed() {
        const [integer, decimal] = [this.integer, this.decimal];
        const precision = this.precision;

        if (decimal) {
          const subDecimal = decimal.substring(0, precision + 1 - integer.length);
          // if contains only zeros
          return subDecimal.match(/^0*$/) ? "" : subDecimal;
        }
        return null;
      },
      integerTrios() {
        return this.getTrios(this.integer);
      }
    },
    methods: {
      getTrios(number) {
        const trios = [];
        const offset = ((number.length % 3) - 3) % 3;
        for (let i = offset; i < number.length; i += 3) {
          const part = number.substring(i, i + 3);
          trios.push(part);
        }
        return trios;
      }
    },
    components: {NumberTrio: script$3}
  };

  const _hoisted_1$1 = { class: "formatted-number" };
  const _hoisted_2 = {
    key: 0,
    class: "minus"
  };
  const _hoisted_3 = { class: "integer" };
  const _hoisted_4 = {
    key: 1,
    class: "point"
  };
  const _hoisted_5 = {
    key: 2,
    class: "decimal"
  };

  function render$2(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_NumberTrio = vue.resolveComponent("NumberTrio");

    return (vue.openBlock(), vue.createBlock("span", _hoisted_1$1, [
      ($options.isNegative)
        ? (vue.openBlock(), vue.createBlock("span", _hoisted_2, "-"))
        : vue.createCommentVNode("v-if", true),
      vue.createVNode("span", _hoisted_3, [
        (vue.openBlock(true), vue.createBlock(vue.Fragment, null, vue.renderList($options.integerTrios, (integerTrio, index) => {
          return (vue.openBlock(), vue.createBlock(_component_NumberTrio, {
            value: integerTrio,
            position: index,
            count: $options.integerTrios.length,
            key: index,
            padding: $props.padding
          }, null, 8 /* PROPS */, ["value", "position", "count", "padding"]))
        }), 128 /* KEYED_FRAGMENT */))
      ]),
      ($options.decimalTrimmed)
        ? (vue.openBlock(), vue.createBlock("span", _hoisted_4, "."))
        : vue.createCommentVNode("v-if", true),
      ($options.decimalTrimmed)
        ? (vue.openBlock(), vue.createBlock("span", _hoisted_5, vue.toDisplayString($options.decimalTrimmed), 1 /* TEXT */))
        : vue.createCommentVNode("v-if", true)
    ]))
  }

  script$2.render = render$2;
  script$2.__file = "components/FormattedNumber.vue";

  var script$1 = {
    name: "NoDoubleClickSelectable",
    data() {
      return {
        timerId: null
      }
    },
    methods: {
      preventUnnecessarySelecting() {
        this.$el.style.userSelect = "none";
        window.getSelection().empty();

        clearTimeout(this.timerId);
        this.timerId = setTimeout(() => {
          this.$el.style.userSelect = "";
        }, 500);
      }
    }
  };

  function render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return (vue.openBlock(), vue.createBlock("span", {
      class: "no-double-click-selectable",
      onClick: _cache[1] || (_cache[1] = (...args) => ($options.preventUnnecessarySelecting && $options.preventUnnecessarySelecting(...args)))
    }, [
      vue.renderSlot(_ctx.$slots, "default")
    ]))
  }

  script$1.render = render$1;
  script$1.__file = "components/NoDoubleClickSelectable.vue";

  var script = {
    name: "Main",
    data() {
      return {
        value: Number.MAX_SAFE_INTEGER,
        color: null
      }
    },
    methods: {
      onClick() {
        this.color = randomHexColor();
      }
    },
    components: {
      FormattedNumber: script$2,
      NoDoubleClickSelectable: script$1
    }
  };

  function randomHexColor() {
    const numbers = [
      Number(Math.trunc(Math.random() * 256)),
      Number(Math.trunc(Math.random() * 256)),
      Number(Math.trunc(Math.random() * 256))
    ];
    return `rgb(${numbers.join()})`;
  }

  const _withId = /*#__PURE__*/vue.withScopeId("data-v-f889b9d8");

  vue.pushScopeId("data-v-f889b9d8");
  const _hoisted_1 = { class: "main" };
  vue.popScopeId();

  const render = /*#__PURE__*/_withId((_ctx, _cache, $props, $setup, $data, $options) => {
    const _component_FormattedNumber = vue.resolveComponent("FormattedNumber");
    const _component_NoDoubleClickSelectable = vue.resolveComponent("NoDoubleClickSelectable");

    return (vue.openBlock(), vue.createBlock("div", _hoisted_1, [
      vue.createVNode("span", {
        class: "number",
        onClick: _cache[1] || (_cache[1] = (...args) => ($options.onClick && $options.onClick(...args)))
      }, [
        vue.createVNode(_component_NoDoubleClickSelectable, null, {
          default: _withId(() => [
            vue.createVNode(_component_FormattedNumber, {
              style: {color: $data.color},
              number: $data.value
            }, null, 8 /* PROPS */, ["style", "number"])
          ]),
          _: 1 /* STABLE */
        })
      ])
    ]))
  });

  script.render = render;
  script.__scopeId = "data-v-f889b9d8";
  script.__file = "components/Main.vue";

  vue.createApp(script).mount("#app");

}(Vue));
//# sourceMappingURL=index.js.map
