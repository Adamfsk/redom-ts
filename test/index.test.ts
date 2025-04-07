import {assert, describe, expect, it, test, vi } from 'vitest';
import {
    dispatch,
    el,
    html,
    list,
    listPool,
    mount, place, router,
    setAttr,
    setChildren,
    setData,
    setStyle, setXlink,
    svg,
    text,
    unmount, viewFactory
} from "../src";

test('exports utils', (): void => {
    expect(setAttr).not.toBeUndefined();
    expect(setStyle).not.toBeUndefined();
});

test('dispatch', async (): Promise<void> => {
    const div = el("div");
    const childDiv = el("div");

    div.appendChild(childDiv);

    await new Promise<void>((resolve): void => {
        div.addEventListener("redom", (e: any) => {
            assert.equal(e.detail.hello, "world");
            resolve();
        });
        dispatch(childDiv, { hello: "world" });
    });
});

describe('element creation', (): void => {
    test("without tagName", (): void => {
        const div = el("");
        assert.equal(div.outerHTML, "<div></div>");
    });

    test("just tagName", (): void => {
        const hello = el("p", "Hello world!");
        assert.equal(hello.outerHTML, "<p>Hello world!</p>");
    });
    test("with Component constructor", (): void => {
        const hello = el(function () {
            this.el = el("p");
        }, "Hello world!");
        assert.equal(hello.el.outerHTML, "<p>Hello world!</p>");

        const hello2 = svg(function () {
            this.el = svg("circle");
        }, "Hello world!");
        assert.equal(hello2.el.outerHTML, "<circle>Hello world!</circle>");
    });
    test("one class", (): void => {
        const hello = el("p.hello", "Hello world!");
        assert.equal(hello.outerHTML, '<p class="hello">Hello world!</p>');
    });
    test("append number", (): void => {
        const one = el("div", 1);
        const minus = el("div", -1);
        const zero = el("div", 0);
        assert.equal(one.outerHTML, "<div>1</div>");
        assert.equal(minus.outerHTML, "<div>-1</div>");
        assert.equal(zero.outerHTML, "<div>0</div>");
    });
    test("multiple class", (): void => {
        const hello = el("p.hello.world", "Hello world!");
        assert.equal(hello.outerHTML, '<p class="hello world">Hello world!</p>');
    });
    test("multiple class, mixed + setattr + remove attribute", (): void => {
        const hello = el("p.hello", { class: "world" }, "Hello world!");
        assert.equal(hello.outerHTML, '<p class="hello world">Hello world!</p>');

        setAttr(hello, { class: "world" });
        assert.equal(hello.outerHTML, '<p class="world">Hello world!</p>');

        setAttr(hello, { class: null });
        assert.equal(hello.outerHTML, "<p>Hello world!</p>");
    });
    test("append text", (): void => {
        const hello = el("p", "Hello", " ", "world!");
        assert.equal(hello.outerHTML, "<p>Hello world!</p>");
    });
    test("ID", (): void => {
        const hello = el("p#hello", "Hello world!");
        assert.equal(hello.outerHTML, '<p id="hello">Hello world!</p>');
    });
    test("styles with object + remove style", (): void => {
        const hello = el("p", { style: { color: "red", opacity: 0 } });
        assert.equal(hello.outerHTML, '<p style="color: red; opacity: 0;"></p>');

        setStyle(hello, "opacity", null);
        assert.equal(hello.outerHTML, '<p style="color: red;"></p>');
    });
    test("styles with String", (): void => {
        const hello = el("p", { style: "color: red;" });
        assert.equal(hello.outerHTML, '<p style="color: red;"></p>');
    });
    test("event handlers", async (): Promise<void> => {
        await new Promise<void>((resolve): void => {
            const hello = el("p", { onclick: resolve }, "Hello world!");
            hello.click();
        });
    });
    test("attributes", (): void => {
        const hello = el("p", { foo: "bar", zero: 0 }, "Hello world!");
        assert.equal(hello.outerHTML, '<p foo="bar" zero="0">Hello world!</p>');
    });
    test("children", (): void => {
        const app = el("app", el("h1", "Hello world!"));
        assert.equal(app.outerHTML, "<app><h1>Hello world!</h1></app>");
    });
    test("child views", (): void => {
        function Test() {
            this.el = el("test");
        }
        const app = el("app", new Test());
        assert.equal(app.outerHTML, "<app><test></test></app>");
    });
    test("child view composition", (): void => {
        function Test() {
            this.el = new (function () {
                this.el = el("test");
            })();
        }
        const app = el("app", new Test());
        assert.equal(app.outerHTML, "<app><test></test></app>");
    });
    test("array", (): void => {
        const ul = el(
            "ul",
            [1, 2, 3].map(function (i) {
                return el("li", i);
            }),
        );
        assert.equal(ul.outerHTML, "<ul><li>1</li><li>2</li><li>3</li></ul>");
    });
    test("dataset + remove", (): void => {
        const p = el("p", { dataset: { a: "test" } });

        assert.equal(p.outerHTML, '<p data-a="test"></p>');

        setData(p, "a", null);

        assert.equal(p.outerHTML, "<p></p>");
    });
    test("input list attribute", (): void => {
        const input = el("input", { list: "asd" });
        assert.equal(input.outerHTML, '<input list="asd">');
    });
    test("middleware", (): void => {const app = el(
            "app",
            function (el) {
                el.setAttribute("ok", "!");
            },
            el("h1", "Hello world!"),
        );
        assert.equal(app.outerHTML, '<app ok="!"><h1>Hello world!</h1></app>');
    });
    test("extend cached", (): void => {
        const H1 = el.extend("h1");
        const h1 = H1("Hello world!");

        assert.equal(h1.outerHTML, "<h1>Hello world!</h1>");
    });
    test("extend", (): void => {
        const H2 = el.extend("h2");
        const h2 = H2("Hello world!");

        assert.equal(h2.outerHTML, "<h2>Hello world!</h2>");
    });
    test("lifecycle events", (): void => {
        const eventsFired = {
            onmount: 0,
            onremount: 0,
            onunmount: 0,
        };
        function Item(id) {
            this.el = el("p");
            this.onmount = function () {
                eventsFired.onmount++;
            };
            this.onremount = function () {
                eventsFired.onremount++;
            };
            this.onunmount = function () {
                eventsFired.onunmount++;
            };
        }
        const item = new Item(1);
        const item2 = new Item(2);
        mount(document.body, item); // mount
        mount(document.head, item2); // mount
        mount(document.body, item2); // unmount & mount
        mount(document.body, item.el); // remount, test view lookup (__redom_view)
        unmount(document.body, item); // unmount
        mount(document.body, item, item2, true); // replace (unmount + mount)
        assert.deepEqual(eventsFired, {
            onmount: 4,
            onremount: 1,
            onunmount: 3,
        });
    });
    test("component lifecycle events inside node element", (): void => {
        const eventsFired = {};
        function Item() {
            this.el = el("p");
            this.onmount = function () {
                eventsFired.onmount = true;
            };
            this.onremount = function () {
                eventsFired.onremount = true;
            };
            this.onunmount = function () {
                eventsFired.onunmount = true;
            };
        }
        const item = el("wrapper", new Item());
        mount(document.body, item);
        mount(document.body, item);
        unmount(document.body, item);
        assert.deepEqual(eventsFired, {
            onmount: true,
            onremount: true,
            onunmount: true,
        });
    });
    test(
        "lifecycle events on component when child unmounted using setchildren",
        (): void => {
            const eventsFired = {
                onmount: 0,
                onunmount: 0,
            };
            function Item() {
                this.el = el("p");
                this.onmount = function () {
                    eventsFired.onmount++;
                };
                this.onunmount = function () {
                    eventsFired.onunmount++;
                };
            }
            const item = new Item();
            const item2 = new Item();
            mount(document.body, item);
            setChildren(item.el, [el("p")]);
            setChildren(item.el, [item2]);
            unmount(document.body, item);
            assert.deepEqual(eventsFired, {
                onmount: 2,
                onunmount: 2,
            });
        },
    );
    test(
        "lifecycle events on component when child with hooks unmounted using setchildren",
        (): void => {
            const eventsFired = {
                onmount: 0,
                onunmount: 0,
            };
            function MountHook() {
                this.el = el("p");
                this.onmount = function () {
                    eventsFired.onmount++;
                };
            }
            function UnmountHook() {
                this.el = el("p");
                this.onunmount = function () {
                    eventsFired.onunmount++;
                };
            }
            const mh = new MountHook();
            const uh = new UnmountHook();
            const uh2 = new UnmountHook();
            mount(document.body, uh);
            setChildren(uh.el, [mh]);
            setChildren(uh.el, [uh2]);
            unmount(document.body, uh);
            assert.deepEqual(eventsFired, {
                onmount: 1,
                onunmount: 2,
            });
        },
    );
    test("setChildren", (): void => {
        const h1 = el.extend("h1");
        const a = h1("a");
        const b = h1("b");
        const c = text("c");
        setChildren(document.body, [a, b]);
        assert.equal(document.body.innerHTML, "<h1>a</h1><h1>b</h1>");
        setChildren(document.body, a);
        assert.equal(document.body.innerHTML, "<h1>a</h1>");

        setChildren(document.body, [[a]], [b, [c]]);
        assert.equal(document.body.innerHTML, "<h1>a</h1><h1>b</h1>c");

        setChildren(
            document.body,
            el("select", el("option", { value: 1 }), el("option", { value: 2 })),
        );
        assert.equal(
            document.body.innerHTML,
            '<select><option value="1"></option><option value="2"></option></select>',
        );
    });
    test("throw error when no arguments", (): void => {
        assert.throws(el, "At least one argument required");
    });
    test("html alias", (): void => {
        assert.equal(el, html);
    });
});

test("listPool", (): void => {
    assert.doesNotThrow(() => listPool(function () {}, null, null));
});

describe("list", (): void => {
    test("without key", (): void => {
        function Item() {
            this.el = el("li");
            this.update = (data) => {
                this.el.textContent = data;
            };
        }

        var items = list("ul", Item);
        items.update(); // empty list
        items.update([1, 2, 3]);
        assert.equal(items.el.outerHTML, "<ul><li>1</li><li>2</li><li>3</li></ul>");
    });
    test("with context", (): void => {
        function Item() {
            this.el = el("li");
            this.update = (data, id, items, context) => {
                this.el.textContent = context + data;
            };
        }

        var items = list(el("ul"), Item);
        items.update();
        items.update([1, 2, 3], 3);
        assert.equal(items.el.outerHTML, "<ul><li>4</li><li>5</li><li>6</li></ul>");
    });
    test("element parent", (): void => {
        function Item() {
            this.el = el("li");
            this.update = (data) => {
                this.el.textContent = data;
            };
        }

        var items = list(el("ul"), Item);
        items.update(); // empty list
        items.update([1, 2, 3]);
        assert.equal(items.el.outerHTML, "<ul><li>1</li><li>2</li><li>3</li></ul>");
    });
    test("component parent", (): void => {
        function Ul() {
            this.el = el("ul");
        }

        function Item() {
            this.el = el("li");
            this.update = (data) => {
                this.el.textContent = data;
            };
        }

        var ul = new Ul();

        var items = list(ul, Item);
        items.update(); // empty list
        items.update([1, 2, 3]);
        assert.equal(items.el.outerHTML, "<ul><li>1</li><li>2</li><li>3</li></ul>");
    });
    test("component parent composition", (): void => {
        function Ul() {
            this.el = new (function () {
                this.el = el("ul");
            })();
        }

        function Item() {
            this.el = el("li");
            this.update = (data) => {
                this.el.textContent = data;
            };
        }

        var ul = new Ul();

        var items = list(ul, Item);
        items.update(); // empty list
        items.update([1, 2, 3]);
        assert.equal(items.el.outerHTML, "<ul><li>1</li><li>2</li><li>3</li></ul>");
    });
    test("with key", (): void => {
        function Item() {
            this.el = el("li");
            this.update = function (data) {
                this.el.textContent = data.id;
                if (this.data) {
                    assert.equal(this.data.id, data.id);
                }
                this.data = data;
            };
        }

        var items = list("ul", Item, "id");

        items.update([{ id: 1 }, { id: 2 }, { id: 3 }]);
        assert.equal(items.el.outerHTML, "<ul><li>1</li><li>2</li><li>3</li></ul>");
        items.update([{ id: 2 }, { id: 3 }, { id: 4 }]);
        assert.equal(items.el.outerHTML, "<ul><li>2</li><li>3</li><li>4</li></ul>");
    });
    test("with function key", (): void => {
        function Item() {
            this.el = el("li");
            this.update = (data) => {
                this.el.textContent = data.id;
                if (this.data) {
                    assert.equal(this.data.id, data.id);
                }
                this.data = data;
            };
        }

        var items = list("ul", Item, (item) => item.id);

        items.update([{ id: 1 }, { id: 2 }, { id: 3 }]);
        assert.equal(items.el.outerHTML, "<ul><li>1</li><li>2</li><li>3</li></ul>");
        items.update([{ id: 2 }, { id: 3 }, { id: 4 }]);
        assert.equal(items.el.outerHTML, "<ul><li>2</li><li>3</li><li>4</li></ul>");
    });
    test("adding / removing", (): void => {
        function Item() {
            this.el = el("li");
            this.update = (data) => {
                this.el.textContent = data;
            };
        }

        var items = list("ul", Item);

        items.update([1]);
        assert.equal(items.el.outerHTML, "<ul><li>1</li></ul>");
        items.update([1, 2]);
        assert.equal(items.el.outerHTML, "<ul><li>1</li><li>2</li></ul>");
        items.update([2]);
        assert.equal(items.el.outerHTML, "<ul><li>2</li></ul>");
    });
    test("extend", (): void => {
        function Td() {
            this.el = el("td");
            this.update = function (data) {
                this.el.textContent = data;
            };
        }
        var Tr = list.extend("tr", Td);
        var Table = list.extend("table", Tr);

        var table = new Table();

        table.update([
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
        ]);
        assert.equal(
            table.el.outerHTML,
            "<table><tr><td>1</td><td>2</td><td>3</td></tr><tr><td>4</td><td>5</td><td>6</td></tr><tr><td>7</td><td>8</td><td>9</td></tr></table>",
        );
    });
    test("mount / unmount / remount", (): void => {
        function Test() {
            this.el = el("test");
        }
        Test.prototype.onmount = vi.fn();
        Test.prototype.onremount = vi.fn();
        Test.prototype.onunmount = vi.fn();
        var test = new Test();
        setChildren(document.body, []);
        mount(document.body, test);
        expect(Test.prototype.onmount).toHaveBeenCalledOnce();
        mount(document.body, test);
        expect(Test.prototype.onremount).toHaveBeenCalledOnce();
        assert.equal(document.body.outerHTML, "<body><test></test></body>"); // pass - 3
        unmount(document.body, test.el);
        expect(Test.prototype.onunmount).toHaveBeenCalledOnce();
        mount(document.body, test.el);
        expect(Test.prototype.onmount).toHaveBeenCalledTimes(2);
        mount(document.body, test.el);
        expect(Test.prototype.onremount).toHaveBeenCalledTimes(2);
        unmount(document.body, test);
        expect(Test.prototype.onunmount).toHaveBeenCalledTimes(2);
        assert.equal(document.body.outerHTML, "<body></body>"); // pass - 8
    });
    test("special cases", (): void => {
        function Td() {
            this.el = el("td");
        }
        Td.prototype.update = function (data) {
            this.el.textContent = data;
        };
        function Tr() {
            this.el = list("tr", Td);
        }
        Tr.prototype.update = function (data) {
            this.el.update(data);
        };
        function Table() {
            this.el = list("table", Tr);
        }
        Table.prototype.update = function (data) {
            this.el.update(data);
        };
        var table = new Table();
        table.update([[1, 2, 3]]);
        setChildren(document.body, []);
        mount(document.body, table);
        assert.equal(
            document.body.innerHTML,
            "<table><tr><td>1</td><td>2</td><td>3</td></tr></table>",
        );
    });
    test("unmounting unmounted", (): void => {
        function Test() {
            this.el = el("div");
        }
        var test = new Test();
        unmount(document.body, test);
        mount(document.body, test);
        assert.equal(document.body.contains(test.el), true);
        unmount(document.body, test);
        assert.equal(document.body.contains(test.el), false);
    });
});

describe("SVG", (): void => {
    test("creation", (): void => {
        var circle = svg("circle");
        assert.equal(circle instanceof SVGElement, true);
        assert.equal(circle.outerHTML, "<circle></circle>");
    });
    test("one class", (): void => {
        var circle = svg("circle.giraffe");
        assert.equal(circle instanceof SVGElement, true);
        assert.equal(circle.outerHTML, '<circle class="giraffe"></circle>');
    });
    test("multiple class", (): void => {
        var circle = svg("circle.giraffe.dog");
        assert.equal(circle instanceof SVGElement, true);
        assert.equal(circle.outerHTML, '<circle class="giraffe dog"></circle>');
    });
    test("ID", (): void => {
        var circle = svg("circle#monkey");
        assert.equal(circle instanceof SVGElement, true);
        assert.equal(circle.outerHTML, '<circle id="monkey"></circle>');
    });
    test("parameters", (): void => {
        var circle = svg("circle", { cx: 1, cy: 2, r: 3 });
        assert.equal(circle.outerHTML, '<circle cx="1" cy="2" r="3"></circle>');
    });
    test("event handler", async (): Promise<void> => {
        await new Promise<void>((resolve): void => {
            var circle = svg("circle", { onclick: resolve });
            circle.dispatchEvent(new CustomEvent("click", {}));
        });
    });
    test("Style string", (): void => {
        var circle = svg("circle", { style: "color: red;" });
        assert.equal(circle.outerHTML, '<circle style="color: red;"></circle>');
    });
    test("Style object", (): void => {
        var circle = svg("circle", { style: { color: "red" } });
        assert.equal(circle.outerHTML, '<circle style="color: red;"></circle>');
    });
    test("with text", (): void => {
        var text = svg("text", "Hello!");
        assert.equal(text.outerHTML, "<text>Hello!</text>");
    });
    test("append text", (): void => {
        var text = svg("text", "Hello", " ", "world!");
        assert.equal(text.outerHTML, "<text>Hello world!</text>");
    });
    test("extend cached", (): void => {
        var Circle = svg.extend("circle");
        var circle = new Circle();
        assert.equal(circle.outerHTML, "<circle></circle>");
    });
    test("extend", (): void => {
        var Line = svg.extend("line");
        var line = new Line();
        assert.equal(line.outerHTML, "<line></line>");
    });
    test("children", (): void => {
        var graphic = svg("svg", svg("circle", { cx: 1, cy: 2, r: 3 }));
        assert.equal(
            graphic.outerHTML,
            '<svg><circle cx="1" cy="2" r="3"></circle></svg>',
        );
    });
    test("child view", (): void => {
        function Circle() {
            this.el = svg("circle", { cx: 1, cy: 2, r: 3 });
        }

        var graphic = svg("svg", new Circle());
        assert.equal(
            graphic.outerHTML,
            '<svg><circle cx="1" cy="2" r="3"></circle></svg>',
        );
    });
    test("middleware", (): void => {
        var graphic = svg(
            "svg",
            function (svg) {
                svg.setAttribute("ok", "!");
            },
            svg("circle", { cx: 1, cy: 2, r: 3 }),
        );
        assert.equal(
            graphic.outerHTML,
            '<svg ok="!"><circle cx="1" cy="2" r="3"></circle></svg>',
        );
    });
    test("throw error when no arguments", (): void => {
        assert.throws(svg, "At least one argument required");
    });
    test("xlink + remove", (): void => {
        var use = svg("use", { xlink: { href: "#menu" } });
        assert.equal(use.outerHTML, '<use href="#menu"></use>');

        setXlink(use, "href", null);
        assert.equal(use.outerHTML, "<use></use>");
    });
});

test("router", (): void => {
    function A() {
        this.el = el("a");
    }
    A.prototype.update = function (val) {
        this.el.textContent = val;
    };

    function B() {
        this.el = el("b");
    }

    B.prototype.update = function (val) {
        this.el.textContent = val;
    };

    var _router = router(".test", {
        a: A,
        b: B,
    });
    _router.update("a", 1);
    assert.equal(_router.el.outerHTML, '<div class="test"><a>1</a></div>');
    _router.update("b", 2);
    assert.equal(_router.el.outerHTML, '<div class="test"><b>2</b></div>');
});
test("router with elements", (): void => {
    var _router = router(".test", {
        a: el(".a"),
        b: el(".b"),
    });

    _router.update("a");
    assert.equal(
        _router.el.outerHTML,
        '<div class="test"><div class="a"></div></div>',
    );

    _router.update("b");
    assert.equal(
        _router.el.outerHTML,
        '<div class="test"><div class="b"></div></div>',
    );
});
test("router with component instances", (): void => {
    function A() {
        this.el = el(".a");
    }

    function B() {
        this.el = el(".b");
    }

    var _router = router(".test", {
        a: new A(),
        b: new B(),
    });

    _router.update("a");
    assert.equal(
        _router.el.outerHTML,
        '<div class="test"><div class="a"></div></div>',
    );

    _router.update("b");
    assert.equal(
        _router.el.outerHTML,
        '<div class="test"><div class="b"></div></div>',
    );
});
test("lifecycle event order consistency check", (): void => {
    var logs = [];

    var nApexes = 3;
    var nLeaves = 2;
    var nBranches = 1;

    function Base(name, content) {
        var _el = html("", content);

        function onmount() {
            logs.push(name + " mounted: " + typeof _el.getBoundingClientRect());
        }

        function onunmount() {
            logs.push(name + " unmount: " + typeof _el.getBoundingClientRect());
        }

        return { el: _el, onmount, onunmount };
    }

    function Apex() {
        return Base("Apex");
    }

    function Leaf() {
        var size = nApexes;
        var apexes = [];
        for (var i = 0; i < size; i++) {
            apexes.push(Apex());
        }
        return Base("Leaf", apexes);
    }

    function Branch() {
        var size = nLeaves;
        var leaves = [];
        for (var i = 0; i < size; i++) {
            leaves.push(Leaf());
        }
        return Base("Branch", leaves);
    }

    function Tree() {
        var size = nBranches;
        var branches = [];
        for (var i = 0; i < size; i++) {
            branches.push(Branch());
        }
        return Base("Tree", branches);
    }

    var expectedLog = [];
    // onmount -- mounted
    expectedLog.push("Tree mounted: object");
    for (let i = 0; i < nBranches; i++) {
        expectedLog.push("Branch mounted: object");
        for (let j = 0; j < nLeaves; j++) {
            expectedLog.push("Leaf mounted: object");
            for (let k = 0; k < nApexes; k++) {
                expectedLog.push("Apex mounted: object");
            }
        }
    }

    // onunmount -- unmounting
    expectedLog.push("Tree unmount: object");
    for (let i = 0; i < nBranches; i++) {
        expectedLog.push("Branch unmount: object");
        for (let j = 0; j < nLeaves; j++) {
            expectedLog.push("Leaf unmount: object");
            for (let k = 0; k < nApexes; k++) {
                expectedLog.push("Apex unmount: object");
            }
        }
    }

    var tree = Tree();
    mount(document.body, tree);
    unmount(document.body, tree);

    assert.deepEqual(logs, expectedLog);
});

test("element place", (): void => {
    var elementPlace = place(el("h1", "Hello RE:DOM!"));

    setChildren(document.body, []);

    mount(document.body, elementPlace);
    mount(document.body, el("p", "After"));
    assert.equal(document.body.innerHTML, "<p>After</p>");

    elementPlace.update(true);
    assert.equal(document.body.innerHTML, "<h1>Hello RE:DOM!</h1><p>After</p>");

    elementPlace.update(false);
    assert.equal(document.body.innerHTML, "<p>After</p>");
});

test("extended element place", (): void => {
    var elementPlace = place(el.extend("h1", "Hello RE:DOM!"));

    setChildren(document.body, []);

    mount(document.body, elementPlace);
    mount(document.body, el("p", "After"));
    assert.equal(document.body.innerHTML, "<p>After</p>");

    elementPlace.update(true);
    assert.equal(document.body.innerHTML, "<h1>Hello RE:DOM!</h1><p>After</p>");

    elementPlace.update(false);
    assert.equal(document.body.innerHTML, "<p>After</p>");

    elementPlace.update(true);
});

test("component place", (): void => {
    function B(initData) {
        this.el = el(".b", "place!");

        assert.equal(initData, 1);
    }

    B.prototype.update = function (data) {
        this.el.textContent = data;
    };

    function A() {
        this.el = el(".a", (this.place = place(B, 1)));
    }

    var a = new A();

    mount(document.body, a);

    a.place.update(true, 2);

    assert.equal(a.el.innerHTML, '<div class="b">2</div>');

    a.place.update(false, 2);

    assert.equal(a.el.innerHTML, "");
    unmount(document.body, a);
});

test("component instance place", (): void => {
    function B(initData) {
        this.el = el(".b", "place!");
    }

    B.prototype.update = function (data) {
        this.el.textContent = data;
    };

    function A() {
        this.el = el(".a", (this.place = place(new B())));
    }

    var a = new A();

    mount(document.body, a);

    a.place.update(true, 2);

    assert.equal(a.el.innerHTML, '<div class="b">2</div>');

    a.place.update(false);

    assert.equal(a.el.innerHTML, "");
    unmount(document.body, a);
});

test("component moved below non-redom element", (): void => {
    var div = document.createElement("div");
    document.body.appendChild(div);
    var targetDiv = document.createElement("div");
    document.body.appendChild(targetDiv);

    function Item() {
        this.el = el("p");
        this.onmount = function () {};
    }

    var item = new Item();
    mount(div, item);
    assert.deepEqual(div.__redom_lifecycle, { onmount: 1 });

    targetDiv.appendChild(div);
    console.log(targetDiv && targetDiv.__redom_lifecycle == null);

    unmount(div, item);
    console.log(targetDiv && targetDiv.__redom_lifecycle == null);
});

test("optimized list diff", (): void => {
    var remounts = 0;

    function Item() {
        this.el = el("p");
        this.onremount = function () {
            remounts++;
        };
    }
    var items = list(el("list"), Item, "id");

    items.update(
        "a b c d e f g".split(" ").map(function (id) {
            return { id: id };
        }),
    );
    items.update(
        "a e c d b f g".split(" ").map(function (id) {
            return { id: id };
        }),
    );

    assert.equal(remounts, 1);
});

test("view factory", (): void => {
    function A() {
        this.el = el("a");
        console.log("A class constructor called");
    }

    A.prototype.update = function () {
        console.log("A class update called");
    };

    function B() {
        this.el = el("b");
        console.log("B class constructor called");
    }

    B.prototype.update = function () {
        console.log("B class update called");
    };

    var items = list(
        "list",
        viewFactory(
            {
                a: A,
                b: B,
            },
            "type",
        ),
        "id",
        { a: 1, b: 2 },
    );

    assert.doesNotThrow(() => items.update([{ type: "a" }, { type: "b" }]));
});

test("view factory edge cases", (): void => {
    try {
        viewFactory();
    } catch (err) {
        assert.equal(err.message, "views must be an object");
    }
    try {
        viewFactory({});
    } catch (err) {
        assert.equal(err.message, "key must be a string");
    }
    var items = list("list", viewFactory({}, "type"));

    try {
        items.update([{ type: "a" }]);
    } catch (err) {
        assert.equal(err.message, "view a not found");
    }
});
