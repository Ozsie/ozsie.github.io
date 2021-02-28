
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var weapons = [{id:0,category:"melee",types:["Knife","Claws","Teeth"],range:{min:0,max:0},firepower:{value:1,per:"weapon"},damage:{value:0,per:"",template:""},rules:[]},{id:1,category:"melee",types:["Machete","Big Claws","Big Teeth"],range:{min:0,max:0},firepower:{value:1,per:"weapon"},damage:{value:1,per:"",template:""},rules:[]},{id:2,category:"melee",types:["Very Big Claws","Very Big Teeth"],range:{min:0,max:0},firepower:{value:1,per:"weapon"},damage:{value:2,per:"",template:""},rules:[]},{id:3,category:"melee",types:["Pistol"],range:{min:0,max:12},firepower:{value:1,per:"weapon"},damage:{value:0,per:"",template:""},rules:[]},{id:4,category:"melee",types:["Magnum Pistol"],range:{min:0,max:12},firepower:{value:1,per:"weapon"},damage:{value:1,per:"",template:""},rules:[]},{id:5,category:"melee",types:["Shotgun"],range:{min:0,max:12},firepower:{value:3,per:""},damage:{value:3,per:"",template:""},rules:["Damage 3 at Range Melee to 6\"","Damage 2 at Range 6\" to 12\""]},{id:6,category:"melee",types:["SMG"],range:{min:0,max:18},firepower:{value:4,per:""},damage:{value:0,per:"",template:""},rules:[]},{id:7,category:"rifle",types:["Assault Rifle"],range:{min:1,max:36},firepower:{value:3,per:""},damage:{value:1,per:"",template:""},rules:[]},{id:8,category:"rifle",types:["Battle Rifle"],range:{min:1,max:48},firepower:{value:2,per:""},damage:{value:2,per:"",template:""},rules:[]},{id:9,category:"support",types:["Flame Thrower","Chemical Sprayer"],range:{},firepower:{},damage:{value:2,per:"model",template:"Flame"},rules:["Limited Ammo","Support Weapon","Burn"]},{id:10,category:"support",types:["40mm Grenade Launcher"],range:{min:4,max:24},firepower:{value:1,per:""},damage:{value:1,per:"model",template:"Small Blast"},rules:["Indirect Fire","Reload","Limited Ammo","Support Weapon"]},{id:11,category:"support",types:["Squad Light Machine Gun"],range:{min:1,max:48},firepower:{value:4,per:""},damage:{value:1,per:"",template:""},rules:["Support Weapon"]},{id:12,category:"support",types:["Rocket Launcher (Anti Armor)"],range:{min:4,max:48},firepower:{value:1,per:""},damage:{value:4,per:"",template:""},rules:["Reload","Limited Ammo","Support Weapon"]},{id:13,category:"support",types:["Rocket Launcher (Anti Infantry)"],range:{min:4,max:48},firepower:{value:1,per:""},damage:{value:2,per:"model",template:"Small Blast"},rules:["Reload","Limited Ammo","Support Weapon"]},{id:14,category:"support",types:["Sniper Rifle"],range:{min:1,max:60},firepower:{value:1,per:""},damage:{value:4,per:"",template:""},rules:["Support Weapon"]},{id:15,category:"support",types:["Heavy Machine Gun"],range:{min:1,max:60},firepower:{value:4,per:""},damage:{value:3,per:"",template:""},rules:["Crew Served"]},{id:16,category:"support",types:["Mortar"],range:{min:6,max:60},firepower:{value:1,per:""},damage:{value:2,per:"model",template:"Large Blast"},rules:["Crew Served","Indirect Fire","Reload","Limited Ammo"]},{id:17,category:"grenade",types:["Molotov Cocktail"],range:{min:1,max:18},firepower:{value:1,per:""},damage:{value:1,per:"model",template:"Small Blast"},rules:["Burn"]},{id:18,category:"grenade",types:["Flash Bang"],range:{min:1,max:18},firepower:{value:1,per:""},damage:{value:0,per:"model",template:"Small Blast"},rules:["1 Pinned/model"]},{id:19,category:"grenade",types:["Smoke Grenade"],range:{min:1,max:18},firepower:{value:1,per:""},damage:{value:0,per:"model",template:"Large Blast"},rules:["Smoke Blocks Line of Sight","-2 to Will check"]},{id:20,category:"grenade",types:["Hand Grenade"],range:{min:1,max:18},firepower:{value:1,per:""},damage:{value:2,per:"model",template:"Small Blast"},rules:[]},{id:21,category:"grenade",types:["Satchel Charge"],range:{min:2,max:12},firepower:{value:1,per:""},damage:{value:3,per:"model",template:"Large Blast"},rules:[]}];

    /* src/Weapons.svelte generated by Svelte v3.31.2 */
    const file = "src/Weapons.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (8:22) {#each weapon.types as type}
    function create_each_block_1(ctx) {
    	let t0_value = /*type*/ ctx[3] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text(",");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(8:22) {#each weapon.types as type}",
    		ctx
    	});

    	return block;
    }

    // (6:1) {#each weapons as weapon}
    function create_each_block(ctx) {
    	let li;
    	let t0_value = /*weapon*/ ctx[0].category + "";
    	let t0;
    	let t1;
    	let t2;
    	let each_value_1 = /*weapon*/ ctx[0].types;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = text(": ");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			add_location(li, file, 6, 2, 91);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(li, null);
    			}

    			append_dev(li, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*weapons*/ 0) {
    				each_value_1 = /*weapon*/ ctx[0].types;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(li, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(6:1) {#each weapons as weapon}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let ul;
    	let each_value = weapons;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(ul, file, 4, 0, 57);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*weapons*/ 0) {
    				each_value = weapons;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Weapons", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Weapons> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ weapons });
    	return [];
    }

    class Weapons extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Weapons",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var recruits = [{id:0,name:"Rookie",wounds:1,movement:5,combatAbility:4,will:4,armor:1,options:{rangedWeapon:1,meleeWeapon:1,grenade:2,basicEquipment:1,skill:0},skills:[],cost:1},{id:1,name:"Hardened",wounds:1,movement:6,combatAbility:5,will:5,armor:2,options:{rangedWeapon:1,meleeWeapon:1,grenade:2,basicEquipment:2,skill:1},skills:[],cost:2},{id:2,name:"Veteran",wounds:1,movement:6,combatAbility:6,will:6,armor:2,options:{rangedWeapon:1,meleeWeapon:1,grenade:2,basicEquipment:3,skill:2},skills:[],cost:3},{id:3,name:"Leader",wounds:2,movement:6,combatAbility:7,will:7,armor:3,options:{rangedWeapon:1,meleeWeapon:1,grenade:2,basicEquipment:3,skill:1},skills:[5],cost:3}];

    /* src/Recruits.svelte generated by Svelte v3.31.2 */
    const file$1 = "src/Recruits.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    // (6:1) {#each recruits as recruit}
    function create_each_block$1(ctx) {
    	let li;
    	let t0_value = /*recruit*/ ctx[0].name + "";
    	let t0;
    	let t1;
    	let t2_value = /*recruit*/ ctx[0].cost + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = text(": ");
    			t2 = text(t2_value);
    			t3 = space();
    			add_location(li, file$1, 6, 2, 95);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    			append_dev(li, t2);
    			append_dev(li, t3);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(6:1) {#each recruits as recruit}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let ul;
    	let each_value = recruits;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(ul, file$1, 4, 0, 59);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*recruits*/ 0) {
    				each_value = recruits;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Recruits", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Recruits> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ recruits });
    	return [];
    }

    class Recruits extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Recruits",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    var skills = [{id:0,name:"Bone Doc",description:"Probably attended Med-school for a semester or had some combat medic training in the military, a Bone Doc can doublr up on Med-Kits when assigning them in the Equipment Slots, meaning that two can be carried per slot. When a Bone Doc applies a Med-Kit to himself or Allied unit, the Wound is replaced with one Pinned Counter rather than two."},{id:1,name:"Fuse Cutter",description:"The explosives expert, the Fuse Cutter can carry up to three Hand Grenades, Molotov Cocktails or Satchel Charges, instead of the standard two. The Fuse Cutter also receives a +2 to all Explosives-related Skill Checks like de-fusing an IED or booby-trapped door."},{id:2,name:"Hard",description:"Walking that fine line between bravery and stupidity, this character ignores their first Pinned result and always receives a +1 bonus to their Will Stat when rolling for Deflected Hits."},{id:3,name:"Hustle",description:"Quick on their feet, whenever this model spends two consecutive actions to move, they receive an extra 2\" to the total. So a Hardened trooper can move 14\" with two back-to-back Move Actions rather than the standard 12\"."},{id:4,name:"Knife Man",description:"Knife men function best up close and personal. They receive a +1 to all Melee Combat rolls and, if appropriately armed, may fire/use two Melee weapons in close combat for one Action."},{id:5,name:"Leader",description:"Leaders grant a +1 bonus to Will/Rally rolls for allied units in Line of Sight to the leader figure. Leaders also have a special 'Order' Action that allows them to 'transfer' their Actions to other members of their squad. The recepient must be within 12\" and in Line of Sight of the Leader figure, and must immediately perform the Ordered Action. Any effects of this transferred Action/s must be taken and resolved before the Leader can perform any more Actions."},{id:6,name:"Scrounger",description:"Some guys have a knack for finding stuff. Scroungers can Search a Hot Spot twice instead of just once. Each Search is a separate Action, but they double your chance at finding something useful."},{id:7,name:"Steady Hands",description:"Maybe their grandfather took them hunting, perhaps they received some special Military training, either way, these shooters get a +1 to all Ranged Attack rolls. This Ability stack with the Aim bonus modifiers and any appropriate Gear."},{id:8,name:"Unload",description:"When this model spends to consecutive Actions on a Ranged Attack with an appropriate ranged combat weapon, such as an Assault Rife, against a single target, it adds two bonus dice to the combined Firepower roll. Unload represents the model emptying the weapons' magazine in one go. After using the Unload ability, the model must spend 1 Actionb to 'reaload' the weapon before it can be fired again."},{id:9,name:"Wrench",description:"This is the one who's always tinkering with the GAZ engine, modding the gas tube on their AK, or jury rigging the camp stove. Handy with anything mechanical, a Wrench gets a +2 to any Mechanical-Related Skill checks."}];

    var equipment = [{id:0,category:"basic",name:"Binoculars",description:"+12\" to Inspect range when surveying Hot Spots or Mission Objectives.",value:200},{id:1,category:"basic",name:"Electric Juice",description:"Immediately grants 2 additional actions. Only 1 action allowed the following turn.",value:100},{id:2,category:"basic",name:"Gas Mask",description:"No Will check required for Smoke or Fumes.",value:200},{id:3,category:"basic",name:"Med-Kit",description:"Replace 1 Wound with 2 Pinned. If used by Bone Doc, replace 1 Wound with 1 Pinned.",value:250},{id:4,category:"basic",name:"Red Dot Sight",description:"For Pistols, SMGs, Shotguns and Assault Rifles. +1 to Ranged Attack Combat Ability Roll at half the weapon's effective range or less.",value:400},{id:5,category:"advanced",name:"Detector",description:"+2 to Will Check when Searching an Anomaly.",value:500},{id:6,category:"advanced",name:"Tool Kit",description:"+2 to all Mechanical Skill Checks and -1 to Action cost.",value:600},{id:7,category:"advanced",name:"NODs",description:"Negates Dark and Low Light LOS and Ranged Attack Penalties.",value:750},{id:8,category:"advanced",name:"Hot Load Ammo",description:"Ranged Weapon only. +1 to Weapon Damage. Enough for 1 mission.",value:350},{id:9,category:"advanced",name:"Scope",description:"Assault Rifles, Battle Rifles and Sniper Rifles only. +1 to Ranged Combat Ability Rolls at greater than half the weapons effective range.",value:750},{id:10,category:"special",name:"Chest Rig",description:"+1 Grenade Slot and +1 Equipment Slot.",value:1000},{id:11,category:"special",name:"Load Bearing West",description:"+2 Grenade Slot and +2 Equipment Slot.",value:1500},{id:12,category:"special",name:"Under Barrel Grenade Launcher",description:"Assault Rifles only. Adds a 40mm Grenade Launcher Option to a character's weapon.",value:1800},{id:13,category:"special",name:"Kevlar Plates",description:"+1 to Characters Armor Rating. Can be added twice per crew member.",value:1800},{id:14,category:"special",name:"Heavy Weapon Reload",description:"+5 ammo of any single type of Limited Ammo weapon.",value:2000}];

    var factions = [{id:0,name:"Military",description:"The Zone Enforcement Unit is tasked with containing the Zone and interdicting the flow of illegal Salvage and dangerous artifacts. Ironic as it's the Military that secretly allows and assists in the flow of said items. Military Crews start with three free pieces of Equipment: two Red Dot Sights and one load of Hot Load Ammo. They get a 20% discount when purchasing new Weapons, and can recruit Rookies at 25% less of the normal price later in the game.",allies:[1],enemies:[2,4],discounts:[{type:"Weapon",value:20,times:-1},{type:"Rookie recruit",value:25,times:-1}],startingEquipment:[4,4,8]},{id:1,name:"Scientists",description:"Affiliated with the government and several large private research agencies, the Scientist faction studies the Zone, hoping to understand - and control - its causes and effects. Although technically protected by the military's Zone Enforcement Unit, they  frequently hire teams to perform elemental research in dangerous areas, run errands, and provide security. Scientist crews start with a free Detector, one free Med-Kit and one free Tool Kit. They receive a 25% discount when purchasing Med-Kits, Tool Kits, Gas Masks and Binoculars at The Stalls, and can hire two Hardened recruits at 50% the normal price later in the game.",allies:[0,3,5],enemies:[],discounts:[{type:"Hardened recruit",value:50,times:2},{type:"Med-Kits, Tool Kits, Gas Masks and Binoculars",value:25,times:-1}],startingEquipment:[5,3,6]},{id:2,name:"Bandits",description:"Vultures, jackals, scavengers, vermin, maggots... the epithets are endless. These thugs rob, harass and extort anyone and everyone they can. Some Bandits crews are street gangs seeking new turf, others are extensions of organized crime syndicates muscling in on the lucrative flow of goods in and out of the Zone. It's all about money. Bandit crews start with two free doses of Electric Juice and a Chest Rig. They always receive one free Molotov Cocktail when visiting The Stalls. Later in the game, they can hire one Veteran recruit at 25% less the normal price and can always recruit Rookies at 50% normal price.",allies:[],enemies:[0,1,5],discounts:[{type:"Molotov Cocktail",value:100,times:-2},{type:"Veteran recruit",value:25,times:1},{type:"Rookie recruit",value:50,times:-1}],startingEquipment:[1,1,10]},{id:3,name:"Independents",description:"Everyone's got to make a living and this bunch plies their trade in the Zone. Whether it's scavenging for artifacts, acting as a guide to researchers and thrill-seeking tourists, or hunting mutants for bounty, Independents want to be lefty alone and get on with their lives. Independents receive a free Gas Mask, Med-Kit, and Scope to start, and get a 20% discount on Basic Equipment items at The Stalls. Independents can always add Hardened recruits at 30% less the going rate.",allies:[1,5],enemies:[],discounts:[{type:"Basic Equipment",value:20,times:-1},{type:"Hardened Recruit",value:30,times:-1}],startingEquipment:[2,3,9]},{id:4,name:"Cultists",description:"'If you find a kettle of crazy, it's best not to stir it'. Well, the Zone is a whole cauldron of madness and there's no shortage of folks willing to whip it to a boil. Cultists believe the Zone is a mystical, mysterious place and have devoted their lives to see it grow and spread. Technically at odds with everyone else, Cultists nonetheless have uneasy alliances with Scientists and Traders, passing valuable information and rare artifacts for profit. Cultists receive a free set of NODs and two Med-Kits when starting. They receive a 20% discount on all Advanced Equipment items at The Stalls, and when hiring new Crew members later in the campaign, their first Veteran and Rookie recruits are free.",allies:[5],enemies:[0],discounts:[{type:"Advanced Equipment",value:20,times:-1},{type:"Veteran Recruit",value:100,times:1},{type:"Rookie Recruit",value:100,times:1}],startingEquipment:[7,3,3]},{id:5,name:"Traders",description:"Someone has to grease the wheels of commerce and these are the guys who keep it all moving. Traders pass goods and information in and out of the Zone and among the various Factions. This makes them extremely useful, as well as a frequent target of Bandits. Because of this, Traders are always looking for reliable security. Traders do not receive any additional starting Gear. However, they receive a permanent 40% discount on all items at The Stalls and can hire Veteran recruits at a 25% discount.",allies:[1,4],enemies:[2],discounts:[{type:"All Items",value:40,times:-1},{type:"Veteran Recruit",value:25,times:-1}],startingEquipment:[]}];

    var storedCrews = localStorage.getItem("crews");
    if (!storedCrews) {
      console.log("Init crews");
      localStorage.setItem("crews", JSON.stringify([]));
      storedCrews = localStorage.getItem("crews");
    }

    let save = (crews) => {
      localStorage.setItem("crews", JSON.stringify(crews));
    };

    var store = {crews: JSON.parse(storedCrews), save};

    var armors = [{id:0,name:"Basic BDU/Foul Weather Gear",armor:0,description:"No Armor Save (except the Critical Success Roll of 1). Counts as an Obscured Target from Ranged Attacks when in Cover.",rules:["Obscured Target when in Cover"]},{id:1,name:"Salvaged/Improvised Body Armor",armor:3,description:"Scrounged ballistic nylon and ceramic plates sewn into tactical vests, battle dress, and foul weather clothing provide Armor 3 and renders the wearer an Obscured Target when in Cover. Most Zone Hostile Bandits and Raiders employ Improvised Body Armor.",rules:["Obscured Target when in Cover"]},{id:2,name:"Civilian/Commercial Body Armor",armor:5,description:"Armor 5 and the unit counts as an Obscured Target from Ranged Attacks when in Cover.",rules:["Obscured Target from Ranged Attacks when in Cover"]},{id:3,name:"Military Body Armor",armor:6,description:"Armor 6 and the unit counts as an Obscured Target from Ranged Attacks when in Cover.",rules:["Obscured Target from Ranged Attacks when in Cover"]},{id:4,name:"Advanced Body Armor",armor:7,description:"Armor 7 with a -1\" penalty to Move Stat but also the unit counts as an Obscured Target from Ranged Attacks when in Cover. Grants 1 extra die to Armor Save rolls, choosing best result.",rules:["Obscured Target from Ranged Attacks when in Cover","-1 penalty to Move","+1 die to Armor save roll, choose best result"]},{id:5,name:"Mimetic Camo",armor:4,description:"Armor 4 plus counts as an Obscured Target for any Melee or Ranged Combat. Cumulative with regular cover and obstruction modifiers.",rules:["Obscured Target from any Ranged or Melee Attacks, cumulative with regular obstruction and cover modifiers"]},{id:6,name:"Military Exo Suit",armor:7,description:"(Power Assisted Advanced Body Armor) Armor 7 with a +2\" bonus to Move stat. PLUS counts as Obscured Target from Ranged Attacks when in Cover. Does not need to make a Will check for Deflected Hits. Grats 1 Extra die to Armor Save rolls. Choose best result.",rules:["+2 to Move","Obscured Target from Ranged Attacks when in Cover","No Will check for Deflected Hits","+1 die to Armor save roll, choose best result"]}];

    let create = (name, factionId) => {
      var faction = createFaction(factionId);
      var leader = createLeader(faction.name);
      var crew = {
        "id": createUUID(),
        "name": name,
        "faction": faction,
        "k": 3,
        "members": [leader]
      };
      return crew
    };

    let updateK = (crew) => {
      var base = crew.members.map(m => m.cost).reduce((accumulator, currentValue) => accumulator + currentValue);
      var upgrades = crew.members.map(m => {
        var template = findRecruit(m.id);
        var moveDiff = m.movement - template.movement;
        var caDiff = m.combatAbility - template.combatAbility;
        var willDiff = m.will - template.will;
        return moveDiff + caDiff + willDiff
      }).reduce((accumulator, currentValue) => accumulator + currentValue);
      crew.k = base + upgrades;
      return crew
    };

    let addRecruit = (recruitId, crew) => {
      var recruit = createMember(recruitId, crew.faction.name);

      crew.members.push(recruit);
      return updateK(crew)
    };

    let addRangedWeapon = (weaponId, member, crew) => {
      var weapon = JSON.parse(JSON.stringify(findWeapon(weaponId)));
      weapon.name = weapon.types.join(" / ");
      member.weapons = [...member.weapons, weapon];
      member.options.rangedWeapon--;
      return crew
    };

    let addMeleeWeapon = (weaponId, member, crew) => {
      var weapon = JSON.parse(JSON.stringify(findWeapon(weaponId)));
      weapon.name = weapon.types.join(" / ");
      member.weapons = [...member.weapons, weapon];
      member.options.meleeWeapon--;
      return crew
    };

    let addGrenade = (weaponId, member, crew) => {
      var weapon = JSON.parse(JSON.stringify(findWeapon(weaponId)));
      weapon.name = weapon.types.join(" / ");
      member.weapons = [...member.weapons, weapon];
      member.options.grenade--;
      return crew
    };

    let addSkill = (skillId, member, crew) => {
      var skill = JSON.parse(JSON.stringify(findSkill(skillId)));
      member.skills = [...member.skills, skill];
      member.options.skill--;
      return crew
    };

    let removeSkill = (skill, member, crew) => {
      if (skill.name != "Leader") {
        var index = member.skills.findIndex(s => s == skill);
        member.skills.splice(index, 1);
        member.options.skill++;
      }
      return crew
    };

    let addBasicEquipment = (equipmentId, member, crew) => {
      var equipment = JSON.parse(JSON.stringify(findEquipment(equipmentId)));
      member.equipment = [...member.equipment, equipment];
      member.options.basicEquipment--;
      return crew
    };

    let removeEquipment = (equipment, member, crew) => {
      if (!equipment.armor) {
        var index = member.equipment.findIndex(e => e == equipment);
        member.equipment.splice(index, 1);
        member.options.basicEquipment++;
      }
      return crew
    };

    let changeFaction = (factionId, crew) => {
      var faction = createFaction(factionId);
      crew.faction = faction;
      return crew
    };

    let hasSkill = (skillId, member) => {
      return !!member.skills.find(skill => skill.id == skillId)
    };

    let hasEquipment = (equipmentId, member) => {
      return !!member.equipment.find(equipment => equipment.id == equipmentId)
    };

    let createFaction = (factionId) => {
      var faction = JSON.parse(JSON.stringify(findFaction(factionId)));
      var allies = faction.allies.map(id => findFactionName(id));
      var enemies = faction.enemies.map(id => findFactionName(id));
      var starters = JSON.parse(JSON.stringify(faction.startingEquipment.map(id => findEquipment(id))));
      faction.allies = allies;
      faction.enemies = enemies;
      faction.startingEquipment = starters;
      return faction
    };

    let createLeader = (factionName) => {
      var leader = JSON.parse(JSON.stringify(createMember(3, factionName)));
      var leaderSkill = findSkill(5);
      leader.skills.push(leaderSkill);

      return leader
    };

    let createMember = (recruitId, factionName) => {
      var member = JSON.parse(JSON.stringify(findRecruit(recruitId)));
      var armor = findArmor(member.armor);
      member.name = "";
      member.armor = armor.armor;
      member.equipment = [armor];
      member.faction = factionName;
      member.weapons = [];
      member.skills = [];

      return member
    };

    let findSkill = (skillId) => {
        return skills.find(skill => skill.id == skillId)
    };

    let findRecruit = (recruitId) => {
        return recruits.find(recruit => recruit.id == recruitId)
    };

    let findArmor = (armorId) => {
        return armors.find(armor => armor.id == armorId)
    };

    let findWeapon = (weaponId) => {
      return weapons.find(weapon => weapon.id == weaponId)
    };

    let findFaction = (factionId) => {
      return factions.find(faction => faction.id == factionId)
    };

    let findEquipment = (equipmentId) => {
      return equipment.find(e => e.id == equipmentId)
    };

    let findFactionName = (factionId) => {
      return findFaction(factionId).name
    };

    let createUUID = () => {
      var dt = new Date().getTime();
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
      });
      return uuid;
    };

    var crewBuilder = { create, addRecruit, updateK, addSkill, addBasicEquipment, addRangedWeapon, addMeleeWeapon, addGrenade, removeSkill, removeEquipment, changeFaction, hasSkill, hasEquipment };

    /* src/NewCrew.svelte generated by Svelte v3.31.2 */

    const { console: console_1 } = globals;
    const file$2 = "src/NewCrew.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[40] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[43] = list[i];
    	child_ctx[44] = list;
    	child_ctx[45] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[46] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[49] = list[i];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[52] = list[i];
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[55] = list[i];
    	return child_ctx;
    }

    function get_each_context_6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[58] = list[i];
    	return child_ctx;
    }

    function get_each_context_7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[61] = list[i];
    	return child_ctx;
    }

    function get_each_context_8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[64] = list[i];
    	return child_ctx;
    }

    function get_each_context_9(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[67] = list[i];
    	return child_ctx;
    }

    function get_each_context_10(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[70] = list[i];
    	return child_ctx;
    }

    function get_each_context_11(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[64] = list[i];
    	return child_ctx;
    }

    function get_each_context_12(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[75] = list[i].type;
    	child_ctx[76] = list[i].value;
    	child_ctx[77] = list[i].times;
    	return child_ctx;
    }

    function get_each_context_13(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[80] = list[i];
    	return child_ctx;
    }

    // (45:8) {#each factions as faction}
    function create_each_block_13(ctx) {
    	let option;
    	let t_value = /*faction*/ ctx[80].name + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = ctx[80].id;
    			option.value = option.__value;
    			add_location(option, file$2, 45, 10, 1382);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_13.name,
    		type: "each",
    		source: "(45:8) {#each factions as faction}",
    		ctx
    	});

    	return block;
    }

    // (58:91) 
    function create_if_block_12(ctx) {
    	let t0;
    	let t1_value = /*times*/ ctx[77] + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			t0 = text("on ");
    			t1 = text(t1_value);
    			t2 = text(" occasions");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 1 && t1_value !== (t1_value = /*times*/ ctx[77] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_12.name,
    		type: "if",
    		source: "(58:91) ",
    		ctx
    	});

    	return block;
    }

    // (58:38) {#if times == -2}
    function create_if_block_11(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("once every visit");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(58:38) {#if times == -2}",
    		ctx
    	});

    	return block;
    }

    // (56:6) {#each crew.faction.discounts as {type, value, times}}
    function create_each_block_12(ctx) {
    	let div;
    	let t0_value = /*value*/ ctx[76] + "";
    	let t0;
    	let t1;
    	let t2_value = /*type*/ ctx[75] + "";
    	let t2;
    	let t3;
    	let t4;

    	function select_block_type(ctx, dirty) {
    		if (/*times*/ ctx[77] == -2) return create_if_block_11;
    		if (/*times*/ ctx[77] > 0) return create_if_block_12;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = text("% discount on ");
    			t2 = text(t2_value);
    			t3 = space();
    			if (if_block) if_block.c();
    			t4 = text(" at The Stalls.");
    			attr_dev(div, "class", "svelte-1kqqn0i");
    			add_location(div, file$2, 56, 8, 1665);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			append_dev(div, t3);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 1 && t0_value !== (t0_value = /*value*/ ctx[76] + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*crew*/ 1 && t2_value !== (t2_value = /*type*/ ctx[75] + "")) set_data_dev(t2, t2_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, t4);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (if_block) {
    				if_block.d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_12.name,
    		type: "each",
    		source: "(56:6) {#each crew.faction.discounts as {type, value, times}}",
    		ctx
    	});

    	return block;
    }

    // (61:6) {#each crew.faction.startingEquipment as equipment}
    function create_each_block_11(ctx) {
    	let div;
    	let span;
    	let t0_value = /*equipment*/ ctx[64].name + "";
    	let t0;
    	let t1;
    	let t2;
    	let t3_value = /*equipment*/ ctx[64].description + "";
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = text(":");
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = space();
    			attr_dev(span, "class", "listHeader svelte-1kqqn0i");
    			add_location(span, file$2, 62, 10, 1914);
    			attr_dev(div, "class", "svelte-1kqqn0i");
    			add_location(div, file$2, 61, 8, 1898);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(div, t2);
    			append_dev(div, t3);
    			append_dev(div, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 1 && t0_value !== (t0_value = /*equipment*/ ctx[64].name + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*crew*/ 1 && t3_value !== (t3_value = /*equipment*/ ctx[64].description + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_11.name,
    		type: "each",
    		source: "(61:6) {#each crew.faction.startingEquipment as equipment}",
    		ctx
    	});

    	return block;
    }

    // (102:12) {#if skill.name != "Leader"}
    function create_if_block_10(ctx) {
    	let span;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[24](/*member*/ ctx[43]);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "[-]";
    			attr_dev(span, "class", "clickable svelte-1kqqn0i");
    			add_location(span, file$2, 102, 14, 3107);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(102:12) {#if skill.name != \\\"Leader\\\"}",
    		ctx
    	});

    	return block;
    }

    // (100:8) {#each member.skills as skill}
    function create_each_block_10(ctx) {
    	let div;
    	let t0;
    	let span;
    	let t1_value = /*skill*/ ctx[70].name + "";
    	let t1;
    	let t2;
    	let t3;
    	let t4_value = /*skill*/ ctx[70].description + "";
    	let t4;
    	let if_block = /*skill*/ ctx[70].name != "Leader" && create_if_block_10(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = text(":");
    			t3 = space();
    			t4 = text(t4_value);
    			attr_dev(span, "class", "listHeader svelte-1kqqn0i");
    			add_location(span, file$2, 104, 12, 3245);
    			attr_dev(div, "class", "svelte-1kqqn0i");
    			add_location(div, file$2, 100, 10, 3046);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, span);
    			append_dev(span, t1);
    			append_dev(span, t2);
    			append_dev(div, t3);
    			append_dev(div, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (/*skill*/ ctx[70].name != "Leader") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_10(ctx);
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*crew*/ 1 && t1_value !== (t1_value = /*skill*/ ctx[70].name + "")) set_data_dev(t1, t1_value);
    			if (dirty[0] & /*crew*/ 1 && t4_value !== (t4_value = /*skill*/ ctx[70].description + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_10.name,
    		type: "each",
    		source: "(100:8) {#each member.skills as skill}",
    		ctx
    	});

    	return block;
    }

    // (108:8) {#if member.options.skill > 0}
    function create_if_block_8(ctx) {
    	let label;
    	let t1;
    	let select;
    	let t2;
    	let button;
    	let mounted;
    	let dispose;
    	let each_value_9 = skills;
    	validate_each_argument(each_value_9);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_9.length; i += 1) {
    		each_blocks[i] = create_each_block_9(get_each_context_9(ctx, each_value_9, i));
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[26](/*member*/ ctx[43]);
    	}

    	const block = {
    		c: function create() {
    			label = element("label");
    			label.textContent = "Add skill";
    			t1 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			button = element("button");
    			button.textContent = "Add";
    			attr_dev(label, "for", "skills");
    			attr_dev(label, "class", "svelte-1kqqn0i");
    			add_location(label, file$2, 108, 10, 3393);
    			attr_dev(select, "name", "skills");
    			attr_dev(select, "class", "svelte-1kqqn0i");
    			if (/*selectedSkill*/ ctx[2] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[25].call(select));
    			add_location(select, file$2, 109, 10, 3441);
    			add_location(button, file$2, 116, 10, 3734);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, select, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*selectedSkill*/ ctx[2]);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[25]),
    					listen_dev(button, "click", click_handler_1, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*crew*/ 1) {
    				each_value_9 = skills;
    				validate_each_argument(each_value_9);
    				let i;

    				for (i = 0; i < each_value_9.length; i += 1) {
    					const child_ctx = get_each_context_9(ctx, each_value_9, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_9(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_9.length;
    			}

    			if (dirty[0] & /*selectedSkill*/ 4) {
    				select_option(select, /*selectedSkill*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(108:8) {#if member.options.skill > 0}",
    		ctx
    	});

    	return block;
    }

    // (112:14) {#if !crewBuilder.hasSkill(newSkill.id, member)}
    function create_if_block_9(ctx) {
    	let option;
    	let t_value = /*newSkill*/ ctx[67].name + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = ctx[67].id;
    			option.value = option.__value;
    			add_location(option, file$2, 112, 16, 3609);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(112:14) {#if !crewBuilder.hasSkill(newSkill.id, member)}",
    		ctx
    	});

    	return block;
    }

    // (111:12) {#each skills as newSkill}
    function create_each_block_9(ctx) {
    	let show_if = !crewBuilder.hasSkill(/*newSkill*/ ctx[67].id, /*member*/ ctx[43]);
    	let if_block_anchor;
    	let if_block = show_if && create_if_block_9(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 1) show_if = !crewBuilder.hasSkill(/*newSkill*/ ctx[67].id, /*member*/ ctx[43]);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_9(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_9.name,
    		type: "each",
    		source: "(111:12) {#each skills as newSkill}",
    		ctx
    	});

    	return block;
    }

    // (128:12) {#if !equipment.armor}
    function create_if_block_7(ctx) {
    	let span;
    	let mounted;
    	let dispose;

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[27](/*equipment*/ ctx[64], /*member*/ ctx[43]);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "[-]";
    			attr_dev(span, "class", "clickable svelte-1kqqn0i");
    			add_location(span, file$2, 128, 14, 4103);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", click_handler_2, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(128:12) {#if !equipment.armor}",
    		ctx
    	});

    	return block;
    }

    // (126:8) {#each member.equipment as equipment}
    function create_each_block_8(ctx) {
    	let div;
    	let t0;
    	let span;
    	let t1_value = /*equipment*/ ctx[64].name + "";
    	let t1;
    	let t2;
    	let t3;
    	let t4_value = /*equipment*/ ctx[64].description + "";
    	let t4;
    	let if_block = !/*equipment*/ ctx[64].armor && create_if_block_7(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = text(":");
    			t3 = space();
    			t4 = text(t4_value);
    			attr_dev(span, "class", "listHeader svelte-1kqqn0i");
    			add_location(span, file$2, 130, 12, 4245);
    			attr_dev(div, "class", "svelte-1kqqn0i");
    			add_location(div, file$2, 126, 10, 4048);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, span);
    			append_dev(span, t1);
    			append_dev(span, t2);
    			append_dev(div, t3);
    			append_dev(div, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (!/*equipment*/ ctx[64].armor) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_7(ctx);
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*crew*/ 1 && t1_value !== (t1_value = /*equipment*/ ctx[64].name + "")) set_data_dev(t1, t1_value);
    			if (dirty[0] & /*crew*/ 1 && t4_value !== (t4_value = /*equipment*/ ctx[64].description + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_8.name,
    		type: "each",
    		source: "(126:8) {#each member.equipment as equipment}",
    		ctx
    	});

    	return block;
    }

    // (135:8) {#if member.options.basicEquipment > 0}
    function create_if_block_6(ctx) {
    	let label;
    	let t1;
    	let select;
    	let t2;
    	let button;
    	let mounted;
    	let dispose;
    	let each_value_7 = /*basicEquipment*/ ctx[8];
    	validate_each_argument(each_value_7);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_7.length; i += 1) {
    		each_blocks[i] = create_each_block_7(get_each_context_7(ctx, each_value_7, i));
    	}

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[29](/*member*/ ctx[43]);
    	}

    	const block = {
    		c: function create() {
    			label = element("label");
    			label.textContent = "Add basic equipment";
    			t1 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			button = element("button");
    			button.textContent = "Add";
    			attr_dev(label, "for", "basicEquipment");
    			attr_dev(label, "class", "svelte-1kqqn0i");
    			add_location(label, file$2, 135, 10, 4411);
    			attr_dev(select, "name", "basicEquipment");
    			attr_dev(select, "class", "svelte-1kqqn0i");
    			if (/*selectedEquipment*/ ctx[3] === void 0) add_render_callback(() => /*select_change_handler_1*/ ctx[28].call(select));
    			add_location(select, file$2, 136, 10, 4477);
    			add_location(button, file$2, 141, 10, 4717);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, select, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*selectedEquipment*/ ctx[3]);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler_1*/ ctx[28]),
    					listen_dev(button, "click", click_handler_3, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*basicEquipment*/ 256) {
    				each_value_7 = /*basicEquipment*/ ctx[8];
    				validate_each_argument(each_value_7);
    				let i;

    				for (i = 0; i < each_value_7.length; i += 1) {
    					const child_ctx = get_each_context_7(ctx, each_value_7, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_7(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_7.length;
    			}

    			if (dirty[0] & /*selectedEquipment, basicEquipment*/ 264) {
    				select_option(select, /*selectedEquipment*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(135:8) {#if member.options.basicEquipment > 0}",
    		ctx
    	});

    	return block;
    }

    // (138:12) {#each basicEquipment as newEquipment}
    function create_each_block_7(ctx) {
    	let option;
    	let t_value = /*newEquipment*/ ctx[61].name + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = ctx[61].id;
    			option.value = option.__value;
    			add_location(option, file$2, 138, 14, 4604);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_7.name,
    		type: "each",
    		source: "(138:12) {#each basicEquipment as newEquipment}",
    		ctx
    	});

    	return block;
    }

    // (156:36) {#if weapon.firepower.per}
    function create_if_block_5(ctx) {
    	let t0;
    	let t1_value = /*weapon*/ ctx[55].firepower.per + "";
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("/");
    			t1 = text(t1_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 1 && t1_value !== (t1_value = /*weapon*/ ctx[55].firepower.per + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(156:36) {#if weapon.firepower.per}",
    		ctx
    	});

    	return block;
    }

    // (158:10) {#if weapon.damage.template}
    function create_if_block_4(ctx) {
    	let t0_value = /*weapon*/ ctx[55].damage.template + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text(", ");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 1 && t0_value !== (t0_value = /*weapon*/ ctx[55].damage.template + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(158:10) {#if weapon.damage.template}",
    		ctx
    	});

    	return block;
    }

    // (158:90) {#if weapon.damage.per}
    function create_if_block_3(ctx) {
    	let t0;
    	let t1_value = /*weapon*/ ctx[55].damage.per + "";
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("/");
    			t1 = text(t1_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 1 && t1_value !== (t1_value = /*weapon*/ ctx[55].damage.per + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(158:90) {#if weapon.damage.per}",
    		ctx
    	});

    	return block;
    }

    // (159:10) {#each weapon.rules as rule}
    function create_each_block_6(ctx) {
    	let t0_value = /*rule*/ ctx[58] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text(",");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 1 && t0_value !== (t0_value = /*rule*/ ctx[58] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_6.name,
    		type: "each",
    		source: "(159:10) {#each weapon.rules as rule}",
    		ctx
    	});

    	return block;
    }

    // (152:4) {#each member.weapons as weapon}
    function create_each_block_5(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*weapon*/ ctx[55].name + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*weapon*/ ctx[55].range.min + "";
    	let t2;
    	let t3;
    	let t4_value = /*weapon*/ ctx[55].range.max + "";
    	let t4;
    	let t5;
    	let td2;
    	let t6_value = /*weapon*/ ctx[55].firepower.value + "";
    	let t6;
    	let t7;
    	let td3;
    	let t8_value = /*weapon*/ ctx[55].damage.value + "";
    	let t8;
    	let t9;
    	let if_block0 = /*weapon*/ ctx[55].firepower.per && create_if_block_5(ctx);
    	let if_block1 = /*weapon*/ ctx[55].damage.template && create_if_block_4(ctx);
    	let if_block2 = /*weapon*/ ctx[55].damage.per && create_if_block_3(ctx);
    	let each_value_6 = /*weapon*/ ctx[55].rules;
    	validate_each_argument(each_value_6);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_6.length; i += 1) {
    		each_blocks[i] = create_each_block_6(get_each_context_6(ctx, each_value_6, i));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = text(" - ");
    			t4 = text(t4_value);
    			t5 = space();
    			td2 = element("td");
    			t6 = text(t6_value);
    			if (if_block0) if_block0.c();
    			t7 = space();
    			td3 = element("td");
    			if (if_block1) if_block1.c();
    			t8 = text(t8_value);
    			if (if_block2) if_block2.c();
    			t9 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(td0, "class", "svelte-1kqqn0i");
    			add_location(td0, file$2, 153, 8, 5031);
    			attr_dev(td1, "class", "svelte-1kqqn0i");
    			add_location(td1, file$2, 154, 8, 5062);
    			attr_dev(td2, "class", "svelte-1kqqn0i");
    			add_location(td2, file$2, 155, 8, 5119);
    			attr_dev(td3, "class", "svelte-1kqqn0i");
    			add_location(td3, file$2, 156, 8, 5215);
    			add_location(tr, file$2, 152, 6, 5018);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(td1, t3);
    			append_dev(td1, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td2);
    			append_dev(td2, t6);
    			if (if_block0) if_block0.m(td2, null);
    			append_dev(tr, t7);
    			append_dev(tr, td3);
    			if (if_block1) if_block1.m(td3, null);
    			append_dev(td3, t8);
    			if (if_block2) if_block2.m(td3, null);
    			append_dev(td3, t9);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(td3, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 1 && t0_value !== (t0_value = /*weapon*/ ctx[55].name + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*crew*/ 1 && t2_value !== (t2_value = /*weapon*/ ctx[55].range.min + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*crew*/ 1 && t4_value !== (t4_value = /*weapon*/ ctx[55].range.max + "")) set_data_dev(t4, t4_value);
    			if (dirty[0] & /*crew*/ 1 && t6_value !== (t6_value = /*weapon*/ ctx[55].firepower.value + "")) set_data_dev(t6, t6_value);

    			if (/*weapon*/ ctx[55].firepower.per) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					if_block0.m(td2, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*weapon*/ ctx[55].damage.template) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_4(ctx);
    					if_block1.c();
    					if_block1.m(td3, t8);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty[0] & /*crew*/ 1 && t8_value !== (t8_value = /*weapon*/ ctx[55].damage.value + "")) set_data_dev(t8, t8_value);

    			if (/*weapon*/ ctx[55].damage.per) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_3(ctx);
    					if_block2.c();
    					if_block2.m(td3, t9);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty[0] & /*crew*/ 1) {
    				each_value_6 = /*weapon*/ ctx[55].rules;
    				validate_each_argument(each_value_6);
    				let i;

    				for (i = 0; i < each_value_6.length; i += 1) {
    					const child_ctx = get_each_context_6(ctx, each_value_6, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(td3, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_6.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(152:4) {#each member.weapons as weapon}",
    		ctx
    	});

    	return block;
    }

    // (163:4) {#if member.options.rangedWeapon > 0}
    function create_if_block_2(ctx) {
    	let tr;
    	let td;
    	let label;
    	let t1;
    	let select;
    	let t2;
    	let button;
    	let mounted;
    	let dispose;
    	let each_value_4 = /*rangedWeapons*/ ctx[9];
    	validate_each_argument(each_value_4);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[31](/*member*/ ctx[43]);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			label = element("label");
    			label.textContent = "Add ranged weapon";
    			t1 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			button = element("button");
    			button.textContent = "Add";
    			attr_dev(label, "for", "rangedWeapon");
    			attr_dev(label, "class", "svelte-1kqqn0i");
    			add_location(label, file$2, 165, 10, 5564);
    			attr_dev(select, "name", "rangedWeapon");
    			attr_dev(select, "class", "svelte-1kqqn0i");
    			if (/*selectedRangedWeapon*/ ctx[4] === void 0) add_render_callback(() => /*select_change_handler_2*/ ctx[30].call(select));
    			add_location(select, file$2, 166, 10, 5626);
    			add_location(button, file$2, 173, 10, 5920);
    			attr_dev(td, "class", "wide svelte-1kqqn0i");
    			attr_dev(td, "colspan", "4");
    			add_location(td, file$2, 164, 8, 5524);
    			attr_dev(tr, "class", "list svelte-1kqqn0i");
    			add_location(tr, file$2, 163, 6, 5498);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(td, label);
    			append_dev(td, t1);
    			append_dev(td, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*selectedRangedWeapon*/ ctx[4]);
    			append_dev(td, t2);
    			append_dev(td, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler_2*/ ctx[30]),
    					listen_dev(button, "click", click_handler_4, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*rangedWeapons*/ 512) {
    				each_value_4 = /*rangedWeapons*/ ctx[9];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_4.length;
    			}

    			if (dirty[0] & /*selectedRangedWeapon, rangedWeapons*/ 528) {
    				select_option(select, /*selectedRangedWeapon*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(163:4) {#if member.options.rangedWeapon > 0}",
    		ctx
    	});

    	return block;
    }

    // (168:12) {#each rangedWeapons as newRangedWeapon}
    function create_each_block_4(ctx) {
    	let option;
    	let t0_value = /*newRangedWeapon*/ ctx[52].types.join(" / ") + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = ctx[52].id;
    			option.value = option.__value;
    			add_location(option, file$2, 168, 14, 5756);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(168:12) {#each rangedWeapons as newRangedWeapon}",
    		ctx
    	});

    	return block;
    }

    // (179:4) {#if member.options.meleeWeapon > 0}
    function create_if_block_1(ctx) {
    	let tr;
    	let td;
    	let label;
    	let t1;
    	let select;
    	let t2;
    	let button;
    	let mounted;
    	let dispose;
    	let each_value_3 = /*meleeWeapons*/ ctx[10];
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	function click_handler_5() {
    		return /*click_handler_5*/ ctx[33](/*member*/ ctx[43]);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			label = element("label");
    			label.textContent = "Add melee weapon";
    			t1 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			button = element("button");
    			button.textContent = "Add";
    			attr_dev(label, "for", "meleeWeapon");
    			attr_dev(label, "class", "svelte-1kqqn0i");
    			add_location(label, file$2, 181, 10, 6179);
    			attr_dev(select, "name", "meleeWeapon");
    			attr_dev(select, "class", "svelte-1kqqn0i");
    			if (/*selectedMeleeWeapon*/ ctx[5] === void 0) add_render_callback(() => /*select_change_handler_3*/ ctx[32].call(select));
    			add_location(select, file$2, 182, 10, 6239);
    			add_location(button, file$2, 189, 10, 6527);
    			attr_dev(td, "class", "wide svelte-1kqqn0i");
    			attr_dev(td, "colspan", "4");
    			add_location(td, file$2, 180, 8, 6139);
    			attr_dev(tr, "class", "list svelte-1kqqn0i");
    			add_location(tr, file$2, 179, 6, 6113);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(td, label);
    			append_dev(td, t1);
    			append_dev(td, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*selectedMeleeWeapon*/ ctx[5]);
    			append_dev(td, t2);
    			append_dev(td, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler_3*/ ctx[32]),
    					listen_dev(button, "click", click_handler_5, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*meleeWeapons*/ 1024) {
    				each_value_3 = /*meleeWeapons*/ ctx[10];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}

    			if (dirty[0] & /*selectedMeleeWeapon, meleeWeapons*/ 1056) {
    				select_option(select, /*selectedMeleeWeapon*/ ctx[5]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(179:4) {#if member.options.meleeWeapon > 0}",
    		ctx
    	});

    	return block;
    }

    // (184:12) {#each meleeWeapons as newMeleeWeapon}
    function create_each_block_3(ctx) {
    	let option;
    	let t0_value = /*newMeleeWeapon*/ ctx[49].types.join(" / ") + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = ctx[49].id;
    			option.value = option.__value;
    			add_location(option, file$2, 184, 14, 6365);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(184:12) {#each meleeWeapons as newMeleeWeapon}",
    		ctx
    	});

    	return block;
    }

    // (195:4) {#if member.options.grenade > 0}
    function create_if_block(ctx) {
    	let tr;
    	let td;
    	let label;
    	let t1;
    	let select;
    	let t2;
    	let button;
    	let mounted;
    	let dispose;
    	let each_value_2 = /*grenades*/ ctx[11];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	function click_handler_6() {
    		return /*click_handler_6*/ ctx[35](/*member*/ ctx[43]);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			label = element("label");
    			label.textContent = "Add grenade";
    			t1 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			button = element("button");
    			button.textContent = "Add";
    			attr_dev(label, "for", "grenade");
    			attr_dev(label, "class", "svelte-1kqqn0i");
    			add_location(label, file$2, 197, 10, 6780);
    			attr_dev(select, "name", "grenade");
    			attr_dev(select, "class", "svelte-1kqqn0i");
    			if (/*selectedGrenade*/ ctx[6] === void 0) add_render_callback(() => /*select_change_handler_4*/ ctx[34].call(select));
    			add_location(select, file$2, 198, 10, 6831);
    			add_location(button, file$2, 205, 10, 7095);
    			attr_dev(td, "class", "wide svelte-1kqqn0i");
    			attr_dev(td, "colspan", "4");
    			add_location(td, file$2, 196, 8, 6740);
    			attr_dev(tr, "class", "list svelte-1kqqn0i");
    			add_location(tr, file$2, 195, 6, 6714);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(td, label);
    			append_dev(td, t1);
    			append_dev(td, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*selectedGrenade*/ ctx[6]);
    			append_dev(td, t2);
    			append_dev(td, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler_4*/ ctx[34]),
    					listen_dev(button, "click", click_handler_6, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*grenades*/ 2048) {
    				each_value_2 = /*grenades*/ ctx[11];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}

    			if (dirty[0] & /*selectedGrenade, grenades*/ 2112) {
    				select_option(select, /*selectedGrenade*/ ctx[6]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(195:4) {#if member.options.grenade > 0}",
    		ctx
    	});

    	return block;
    }

    // (200:12) {#each grenades as newGrenade}
    function create_each_block_2(ctx) {
    	let option;
    	let t0_value = /*newGrenade*/ ctx[46].types.join(" / ") + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = ctx[46].id;
    			option.value = option.__value;
    			add_location(option, file$2, 200, 14, 6941);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(200:12) {#each grenades as newGrenade}",
    		ctx
    	});

    	return block;
    }

    // (69:0) {#each crew.members as member}
    function create_each_block_1$1(ctx) {
    	let table;
    	let tr0;
    	let th0;
    	let t1;
    	let td0;
    	let input0;
    	let t2;
    	let th1;
    	let t4;
    	let td1;
    	let t5_value = /*crew*/ ctx[0].faction.name + "";
    	let t5;
    	let t6;
    	let tr1;
    	let th2;
    	let t8;
    	let td2;
    	let t9_value = /*member*/ ctx[43].wounds + "";
    	let t9;
    	let t10;
    	let th3;
    	let t12;
    	let td3;
    	let t13_value = /*member*/ ctx[43].cost + "";
    	let t13;
    	let t14;
    	let tr2;
    	let th4;
    	let t16;
    	let th5;
    	let t18;
    	let th6;
    	let t20;
    	let th7;
    	let t22;
    	let tr3;
    	let td4;
    	let input1;
    	let t23;
    	let td5;
    	let input2;
    	let t24;
    	let td6;
    	let t25_value = /*member*/ ctx[43].armor + "";
    	let t25;
    	let t26;
    	let td7;
    	let input3;
    	let t27;
    	let tr4;
    	let th8;
    	let t29;
    	let tr5;
    	let td8;
    	let t30;
    	let t31;
    	let tr6;
    	let th9;
    	let t33;
    	let tr7;
    	let td9;
    	let t34;
    	let t35;
    	let tr8;
    	let th10;
    	let t37;
    	let th11;
    	let t39;
    	let th12;
    	let t41;
    	let th13;
    	let t43;
    	let t44;
    	let t45;
    	let t46;
    	let mounted;
    	let dispose;

    	function input0_input_handler() {
    		/*input0_input_handler*/ ctx[17].call(input0, /*each_value_1*/ ctx[44], /*member_index*/ ctx[45]);
    	}

    	function input1_input_handler() {
    		/*input1_input_handler*/ ctx[18].call(input1, /*each_value_1*/ ctx[44], /*member_index*/ ctx[45]);
    	}

    	function input2_input_handler() {
    		/*input2_input_handler*/ ctx[20].call(input2, /*each_value_1*/ ctx[44], /*member_index*/ ctx[45]);
    	}

    	function input3_input_handler() {
    		/*input3_input_handler*/ ctx[22].call(input3, /*each_value_1*/ ctx[44], /*member_index*/ ctx[45]);
    	}

    	let each_value_10 = /*member*/ ctx[43].skills;
    	validate_each_argument(each_value_10);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_10.length; i += 1) {
    		each_blocks_2[i] = create_each_block_10(get_each_context_10(ctx, each_value_10, i));
    	}

    	let if_block0 = /*member*/ ctx[43].options.skill > 0 && create_if_block_8(ctx);
    	let each_value_8 = /*member*/ ctx[43].equipment;
    	validate_each_argument(each_value_8);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_8.length; i += 1) {
    		each_blocks_1[i] = create_each_block_8(get_each_context_8(ctx, each_value_8, i));
    	}

    	let if_block1 = /*member*/ ctx[43].options.basicEquipment > 0 && create_if_block_6(ctx);
    	let each_value_5 = /*member*/ ctx[43].weapons;
    	validate_each_argument(each_value_5);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	let if_block2 = /*member*/ ctx[43].options.rangedWeapon > 0 && create_if_block_2(ctx);
    	let if_block3 = /*member*/ ctx[43].options.meleeWeapon > 0 && create_if_block_1(ctx);
    	let if_block4 = /*member*/ ctx[43].options.grenade > 0 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			table = element("table");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "Name";
    			t1 = space();
    			td0 = element("td");
    			input0 = element("input");
    			t2 = space();
    			th1 = element("th");
    			th1.textContent = "Faction";
    			t4 = space();
    			td1 = element("td");
    			t5 = text(t5_value);
    			t6 = space();
    			tr1 = element("tr");
    			th2 = element("th");
    			th2.textContent = "Wounds";
    			t8 = space();
    			td2 = element("td");
    			t9 = text(t9_value);
    			t10 = space();
    			th3 = element("th");
    			th3.textContent = "Combat Experience";
    			t12 = space();
    			td3 = element("td");
    			t13 = text(t13_value);
    			t14 = space();
    			tr2 = element("tr");
    			th4 = element("th");
    			th4.textContent = "Movement";
    			t16 = space();
    			th5 = element("th");
    			th5.textContent = "Combat Ability";
    			t18 = space();
    			th6 = element("th");
    			th6.textContent = "Armor";
    			t20 = space();
    			th7 = element("th");
    			th7.textContent = "Will";
    			t22 = space();
    			tr3 = element("tr");
    			td4 = element("td");
    			input1 = element("input");
    			t23 = space();
    			td5 = element("td");
    			input2 = element("input");
    			t24 = space();
    			td6 = element("td");
    			t25 = text(t25_value);
    			t26 = space();
    			td7 = element("td");
    			input3 = element("input");
    			t27 = space();
    			tr4 = element("tr");
    			th8 = element("th");
    			th8.textContent = "Skills";
    			t29 = space();
    			tr5 = element("tr");
    			td8 = element("td");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t30 = space();
    			if (if_block0) if_block0.c();
    			t31 = space();
    			tr6 = element("tr");
    			th9 = element("th");
    			th9.textContent = "Equipment";
    			t33 = space();
    			tr7 = element("tr");
    			td9 = element("td");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t34 = space();
    			if (if_block1) if_block1.c();
    			t35 = space();
    			tr8 = element("tr");
    			th10 = element("th");
    			th10.textContent = "Weapon Type";
    			t37 = space();
    			th11 = element("th");
    			th11.textContent = "Range";
    			t39 = space();
    			th12 = element("th");
    			th12.textContent = "Firepower";
    			t41 = space();
    			th13 = element("th");
    			th13.textContent = "Damage";
    			t43 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t44 = space();
    			if (if_block2) if_block2.c();
    			t45 = space();
    			if (if_block3) if_block3.c();
    			t46 = space();
    			if (if_block4) if_block4.c();
    			attr_dev(th0, "class", "svelte-1kqqn0i");
    			add_location(th0, file$2, 71, 6, 2100);
    			attr_dev(input0, "class", "svelte-1kqqn0i");
    			add_location(input0, file$2, 72, 10, 2124);
    			attr_dev(td0, "class", "svelte-1kqqn0i");
    			add_location(td0, file$2, 72, 6, 2120);
    			attr_dev(th1, "class", "svelte-1kqqn0i");
    			add_location(th1, file$2, 73, 6, 2168);
    			attr_dev(td1, "class", "svelte-1kqqn0i");
    			add_location(td1, file$2, 74, 6, 2191);
    			add_location(tr0, file$2, 70, 4, 2089);
    			attr_dev(th2, "class", "svelte-1kqqn0i");
    			add_location(th2, file$2, 77, 6, 2245);
    			attr_dev(td2, "class", "svelte-1kqqn0i");
    			add_location(td2, file$2, 78, 6, 2267);
    			attr_dev(th3, "class", "svelte-1kqqn0i");
    			add_location(th3, file$2, 79, 6, 2298);
    			attr_dev(td3, "class", "svelte-1kqqn0i");
    			add_location(td3, file$2, 80, 6, 2331);
    			add_location(tr1, file$2, 76, 4, 2234);
    			attr_dev(th4, "class", "svelte-1kqqn0i");
    			add_location(th4, file$2, 83, 6, 2379);
    			attr_dev(th5, "class", "svelte-1kqqn0i");
    			add_location(th5, file$2, 84, 6, 2403);
    			attr_dev(th6, "class", "svelte-1kqqn0i");
    			add_location(th6, file$2, 85, 6, 2433);
    			attr_dev(th7, "class", "svelte-1kqqn0i");
    			add_location(th7, file$2, 86, 6, 2454);
    			add_location(tr2, file$2, 82, 4, 2368);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "class", "svelte-1kqqn0i");
    			add_location(input1, file$2, 89, 10, 2497);
    			attr_dev(td4, "class", "svelte-1kqqn0i");
    			add_location(td4, file$2, 89, 6, 2493);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "class", "svelte-1kqqn0i");
    			add_location(input2, file$2, 90, 10, 2612);
    			attr_dev(td5, "class", "svelte-1kqqn0i");
    			add_location(td5, file$2, 90, 6, 2608);
    			attr_dev(td6, "class", "svelte-1kqqn0i");
    			add_location(td6, file$2, 91, 6, 2728);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "class", "svelte-1kqqn0i");
    			add_location(input3, file$2, 92, 10, 2762);
    			attr_dev(td7, "class", "svelte-1kqqn0i");
    			add_location(td7, file$2, 92, 6, 2758);
    			add_location(tr3, file$2, 88, 4, 2482);
    			attr_dev(th8, "class", "wide svelte-1kqqn0i");
    			attr_dev(th8, "colspan", "4");
    			add_location(th8, file$2, 95, 6, 2888);
    			add_location(tr4, file$2, 94, 4, 2877);
    			attr_dev(td8, "class", "wide svelte-1kqqn0i");
    			attr_dev(td8, "colspan", "4");
    			add_location(td8, file$2, 98, 6, 2967);
    			attr_dev(tr5, "class", "list svelte-1kqqn0i");
    			add_location(tr5, file$2, 97, 4, 2943);
    			attr_dev(th9, "class", "wide svelte-1kqqn0i");
    			attr_dev(th9, "colspan", "4");
    			add_location(th9, file$2, 121, 6, 3880);
    			add_location(tr6, file$2, 120, 4, 3869);
    			attr_dev(td9, "class", "wide svelte-1kqqn0i");
    			attr_dev(td9, "colspan", "4");
    			add_location(td9, file$2, 124, 6, 3962);
    			attr_dev(tr7, "class", "list svelte-1kqqn0i");
    			add_location(tr7, file$2, 123, 4, 3938);
    			attr_dev(th10, "class", "svelte-1kqqn0i");
    			add_location(th10, file$2, 146, 6, 4876);
    			attr_dev(th11, "class", "svelte-1kqqn0i");
    			add_location(th11, file$2, 147, 6, 4903);
    			attr_dev(th12, "class", "svelte-1kqqn0i");
    			add_location(th12, file$2, 148, 6, 4924);
    			attr_dev(th13, "class", "svelte-1kqqn0i");
    			add_location(th13, file$2, 149, 6, 4949);
    			add_location(tr8, file$2, 145, 4, 4865);
    			attr_dev(table, "class", "svelte-1kqqn0i");
    			add_location(table, file$2, 69, 2, 2077);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t1);
    			append_dev(tr0, td0);
    			append_dev(td0, input0);
    			set_input_value(input0, /*member*/ ctx[43].name);
    			append_dev(tr0, t2);
    			append_dev(tr0, th1);
    			append_dev(tr0, t4);
    			append_dev(tr0, td1);
    			append_dev(td1, t5);
    			append_dev(table, t6);
    			append_dev(table, tr1);
    			append_dev(tr1, th2);
    			append_dev(tr1, t8);
    			append_dev(tr1, td2);
    			append_dev(td2, t9);
    			append_dev(tr1, t10);
    			append_dev(tr1, th3);
    			append_dev(tr1, t12);
    			append_dev(tr1, td3);
    			append_dev(td3, t13);
    			append_dev(table, t14);
    			append_dev(table, tr2);
    			append_dev(tr2, th4);
    			append_dev(tr2, t16);
    			append_dev(tr2, th5);
    			append_dev(tr2, t18);
    			append_dev(tr2, th6);
    			append_dev(tr2, t20);
    			append_dev(tr2, th7);
    			append_dev(table, t22);
    			append_dev(table, tr3);
    			append_dev(tr3, td4);
    			append_dev(td4, input1);
    			set_input_value(input1, /*member*/ ctx[43].movement);
    			append_dev(tr3, t23);
    			append_dev(tr3, td5);
    			append_dev(td5, input2);
    			set_input_value(input2, /*member*/ ctx[43].combatAbility);
    			append_dev(tr3, t24);
    			append_dev(tr3, td6);
    			append_dev(td6, t25);
    			append_dev(tr3, t26);
    			append_dev(tr3, td7);
    			append_dev(td7, input3);
    			set_input_value(input3, /*member*/ ctx[43].will);
    			append_dev(table, t27);
    			append_dev(table, tr4);
    			append_dev(tr4, th8);
    			append_dev(table, t29);
    			append_dev(table, tr5);
    			append_dev(tr5, td8);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(td8, null);
    			}

    			append_dev(td8, t30);
    			if (if_block0) if_block0.m(td8, null);
    			append_dev(table, t31);
    			append_dev(table, tr6);
    			append_dev(tr6, th9);
    			append_dev(table, t33);
    			append_dev(table, tr7);
    			append_dev(tr7, td9);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(td9, null);
    			}

    			append_dev(td9, t34);
    			if (if_block1) if_block1.m(td9, null);
    			append_dev(table, t35);
    			append_dev(table, tr8);
    			append_dev(tr8, th10);
    			append_dev(tr8, t37);
    			append_dev(tr8, th11);
    			append_dev(tr8, t39);
    			append_dev(tr8, th12);
    			append_dev(tr8, t41);
    			append_dev(tr8, th13);
    			append_dev(table, t43);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			append_dev(table, t44);
    			if (if_block2) if_block2.m(table, null);
    			append_dev(table, t45);
    			if (if_block3) if_block3.m(table, null);
    			append_dev(table, t46);
    			if (if_block4) if_block4.m(table, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", input0_input_handler),
    					listen_dev(input1, "input", input1_input_handler),
    					listen_dev(input1, "change", /*change_handler_1*/ ctx[19], false, false, false),
    					listen_dev(input2, "input", input2_input_handler),
    					listen_dev(input2, "change", /*change_handler_2*/ ctx[21], false, false, false),
    					listen_dev(input3, "input", input3_input_handler),
    					listen_dev(input3, "change", /*change_handler_3*/ ctx[23], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*crew*/ 1 && input0.value !== /*member*/ ctx[43].name) {
    				set_input_value(input0, /*member*/ ctx[43].name);
    			}

    			if (dirty[0] & /*crew*/ 1 && t5_value !== (t5_value = /*crew*/ ctx[0].faction.name + "")) set_data_dev(t5, t5_value);
    			if (dirty[0] & /*crew*/ 1 && t9_value !== (t9_value = /*member*/ ctx[43].wounds + "")) set_data_dev(t9, t9_value);
    			if (dirty[0] & /*crew*/ 1 && t13_value !== (t13_value = /*member*/ ctx[43].cost + "")) set_data_dev(t13, t13_value);

    			if (dirty[0] & /*crew*/ 1 && to_number(input1.value) !== /*member*/ ctx[43].movement) {
    				set_input_value(input1, /*member*/ ctx[43].movement);
    			}

    			if (dirty[0] & /*crew*/ 1 && to_number(input2.value) !== /*member*/ ctx[43].combatAbility) {
    				set_input_value(input2, /*member*/ ctx[43].combatAbility);
    			}

    			if (dirty[0] & /*crew*/ 1 && t25_value !== (t25_value = /*member*/ ctx[43].armor + "")) set_data_dev(t25, t25_value);

    			if (dirty[0] & /*crew*/ 1 && to_number(input3.value) !== /*member*/ ctx[43].will) {
    				set_input_value(input3, /*member*/ ctx[43].will);
    			}

    			if (dirty[0] & /*crew*/ 1 | dirty[2] & /*equipment*/ 4) {
    				each_value_10 = /*member*/ ctx[43].skills;
    				validate_each_argument(each_value_10);
    				let i;

    				for (i = 0; i < each_value_10.length; i += 1) {
    					const child_ctx = get_each_context_10(ctx, each_value_10, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_10(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(td8, t30);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_10.length;
    			}

    			if (/*member*/ ctx[43].options.skill > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_8(ctx);
    					if_block0.c();
    					if_block0.m(td8, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty[0] & /*crew*/ 1) {
    				each_value_8 = /*member*/ ctx[43].equipment;
    				validate_each_argument(each_value_8);
    				let i;

    				for (i = 0; i < each_value_8.length; i += 1) {
    					const child_ctx = get_each_context_8(ctx, each_value_8, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_8(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(td9, t34);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_8.length;
    			}

    			if (/*member*/ ctx[43].options.basicEquipment > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_6(ctx);
    					if_block1.c();
    					if_block1.m(td9, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty[0] & /*crew*/ 1) {
    				each_value_5 = /*member*/ ctx[43].weapons;
    				validate_each_argument(each_value_5);
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, t44);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_5.length;
    			}

    			if (/*member*/ ctx[43].options.rangedWeapon > 0) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_2(ctx);
    					if_block2.c();
    					if_block2.m(table, t45);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*member*/ ctx[43].options.meleeWeapon > 0) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block_1(ctx);
    					if_block3.c();
    					if_block3.m(table, t46);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (/*member*/ ctx[43].options.grenade > 0) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);
    				} else {
    					if_block4 = create_if_block(ctx);
    					if_block4.c();
    					if_block4.m(table, null);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks_2, detaching);
    			if (if_block0) if_block0.d();
    			destroy_each(each_blocks_1, detaching);
    			if (if_block1) if_block1.d();
    			destroy_each(each_blocks, detaching);
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(69:0) {#each crew.members as member}",
    		ctx
    	});

    	return block;
    }

    // (216:4) {#each nonLeaders as newRecruit}
    function create_each_block$2(ctx) {
    	let option;
    	let t_value = /*newRecruit*/ ctx[40].name + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = ctx[40].id;
    			option.value = option.__value;
    			add_location(option, file$2, 216, 6, 7397);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(216:4) {#each nonLeaders as newRecruit}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div0;
    	let t0;
    	let t1_value = /*crew*/ ctx[0].k + "";
    	let t1;
    	let t2;
    	let table;
    	let tr0;
    	let th0;
    	let t4;
    	let td0;
    	let input;
    	let t5;
    	let th1;
    	let t7;
    	let td1;
    	let select0;
    	let t8;
    	let tr1;
    	let th2;
    	let t10;
    	let tr2;
    	let td2;
    	let t11;
    	let t12;
    	let t13;
    	let div1;
    	let label;
    	let t15;
    	let select1;
    	let t16;
    	let button0;
    	let t18;
    	let button1;
    	let t20;
    	let button2;
    	let t22;
    	let button3;
    	let mounted;
    	let dispose;
    	let each_value_13 = factions;
    	validate_each_argument(each_value_13);
    	let each_blocks_4 = [];

    	for (let i = 0; i < each_value_13.length; i += 1) {
    		each_blocks_4[i] = create_each_block_13(get_each_context_13(ctx, each_value_13, i));
    	}

    	let each_value_12 = /*crew*/ ctx[0].faction.discounts;
    	validate_each_argument(each_value_12);
    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_12.length; i += 1) {
    		each_blocks_3[i] = create_each_block_12(get_each_context_12(ctx, each_value_12, i));
    	}

    	let each_value_11 = /*crew*/ ctx[0].faction.startingEquipment;
    	validate_each_argument(each_value_11);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_11.length; i += 1) {
    		each_blocks_2[i] = create_each_block_11(get_each_context_11(ctx, each_value_11, i));
    	}

    	let each_value_1 = /*crew*/ ctx[0].members;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = /*nonLeaders*/ ctx[12];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text("K:");
    			t1 = text(t1_value);
    			t2 = space();
    			table = element("table");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "Crew Name";
    			t4 = space();
    			td0 = element("td");
    			input = element("input");
    			t5 = space();
    			th1 = element("th");
    			th1.textContent = "Faction";
    			t7 = space();
    			td1 = element("td");
    			select0 = element("select");

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].c();
    			}

    			t8 = space();
    			tr1 = element("tr");
    			th2 = element("th");
    			th2.textContent = "Notes";
    			t10 = space();
    			tr2 = element("tr");
    			td2 = element("td");

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t11 = space();

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t12 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t13 = space();
    			div1 = element("div");
    			label = element("label");
    			label.textContent = "Add recruit";
    			t15 = space();
    			select1 = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t16 = space();
    			button0 = element("button");
    			button0.textContent = "Add";
    			t18 = space();
    			button1 = element("button");
    			button1.textContent = "LOG";
    			t20 = space();
    			button2 = element("button");
    			button2.textContent = "Save";
    			t22 = space();
    			button3 = element("button");
    			button3.textContent = "Back";
    			attr_dev(div0, "class", "svelte-1kqqn0i");
    			add_location(div0, file$2, 36, 0, 1084);
    			attr_dev(th0, "class", "svelte-1kqqn0i");
    			add_location(th0, file$2, 39, 4, 1125);
    			attr_dev(input, "class", "svelte-1kqqn0i");
    			add_location(input, file$2, 40, 8, 1152);
    			attr_dev(td0, "class", "svelte-1kqqn0i");
    			add_location(td0, file$2, 40, 4, 1148);
    			attr_dev(th1, "class", "svelte-1kqqn0i");
    			add_location(th1, file$2, 41, 4, 1192);
    			attr_dev(select0, "class", "svelte-1kqqn0i");
    			if (/*crew*/ ctx[0].faction.id === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[15].call(select0));
    			add_location(select0, file$2, 43, 6, 1224);
    			attr_dev(td1, "class", "svelte-1kqqn0i");
    			add_location(td1, file$2, 42, 4, 1213);
    			add_location(tr0, file$2, 38, 2, 1116);
    			attr_dev(th2, "class", "wide svelte-1kqqn0i");
    			attr_dev(th2, "colspan", "4");
    			add_location(th2, file$2, 51, 4, 1494);
    			add_location(tr1, file$2, 50, 2, 1485);
    			attr_dev(td2, "class", "wide svelte-1kqqn0i");
    			attr_dev(td2, "colspan", "4");
    			add_location(td2, file$2, 54, 4, 1566);
    			attr_dev(tr2, "class", "list svelte-1kqqn0i");
    			add_location(tr2, file$2, 53, 2, 1544);
    			attr_dev(table, "class", "svelte-1kqqn0i");
    			add_location(table, file$2, 37, 0, 1106);
    			attr_dev(label, "for", "recruit");
    			attr_dev(label, "class", "svelte-1kqqn0i");
    			add_location(label, file$2, 213, 2, 7258);
    			attr_dev(select1, "name", "recruit");
    			attr_dev(select1, "class", "svelte-1kqqn0i");
    			if (/*selectedRecruit*/ ctx[7] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[36].call(select1));
    			add_location(select1, file$2, 214, 2, 7301);
    			add_location(button0, file$2, 219, 2, 7482);
    			attr_dev(div1, "class", "svelte-1kqqn0i");
    			add_location(div1, file$2, 212, 0, 7250);
    			add_location(button1, file$2, 221, 0, 7580);
    			add_location(button2, file$2, 222, 0, 7636);
    			add_location(button3, file$2, 223, 0, 7678);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, table, anchor);
    			append_dev(table, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t4);
    			append_dev(tr0, td0);
    			append_dev(td0, input);
    			set_input_value(input, /*crew*/ ctx[0].name);
    			append_dev(tr0, t5);
    			append_dev(tr0, th1);
    			append_dev(tr0, t7);
    			append_dev(tr0, td1);
    			append_dev(td1, select0);

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].m(select0, null);
    			}

    			select_option(select0, /*crew*/ ctx[0].faction.id);
    			append_dev(table, t8);
    			append_dev(table, tr1);
    			append_dev(tr1, th2);
    			append_dev(table, t10);
    			append_dev(table, tr2);
    			append_dev(tr2, td2);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].m(td2, null);
    			}

    			append_dev(td2, t11);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(td2, null);
    			}

    			insert_dev(target, t12, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(target, anchor);
    			}

    			insert_dev(target, t13, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, label);
    			append_dev(div1, t15);
    			append_dev(div1, select1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select1, null);
    			}

    			select_option(select1, /*selectedRecruit*/ ctx[7]);
    			append_dev(div1, t16);
    			append_dev(div1, button0);
    			insert_dev(target, t18, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, button2, anchor);
    			insert_dev(target, t22, anchor);
    			insert_dev(target, button3, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[14]),
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[15]),
    					listen_dev(select0, "change", /*change_handler*/ ctx[16], false, false, false),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[36]),
    					listen_dev(button0, "click", /*click_handler_7*/ ctx[37], false, false, false),
    					listen_dev(button1, "click", /*click_handler_8*/ ctx[38], false, false, false),
    					listen_dev(button2, "click", /*saveCrew*/ ctx[13], false, false, false),
    					listen_dev(button3, "click", /*click_handler_9*/ ctx[39], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 1 && t1_value !== (t1_value = /*crew*/ ctx[0].k + "")) set_data_dev(t1, t1_value);

    			if (dirty[0] & /*crew*/ 1 && input.value !== /*crew*/ ctx[0].name) {
    				set_input_value(input, /*crew*/ ctx[0].name);
    			}

    			if (dirty & /*factions*/ 0) {
    				each_value_13 = factions;
    				validate_each_argument(each_value_13);
    				let i;

    				for (i = 0; i < each_value_13.length; i += 1) {
    					const child_ctx = get_each_context_13(ctx, each_value_13, i);

    					if (each_blocks_4[i]) {
    						each_blocks_4[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_4[i] = create_each_block_13(child_ctx);
    						each_blocks_4[i].c();
    						each_blocks_4[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_4.length; i += 1) {
    					each_blocks_4[i].d(1);
    				}

    				each_blocks_4.length = each_value_13.length;
    			}

    			if (dirty[0] & /*crew*/ 1) {
    				select_option(select0, /*crew*/ ctx[0].faction.id);
    			}

    			if (dirty[0] & /*crew*/ 1) {
    				each_value_12 = /*crew*/ ctx[0].faction.discounts;
    				validate_each_argument(each_value_12);
    				let i;

    				for (i = 0; i < each_value_12.length; i += 1) {
    					const child_ctx = get_each_context_12(ctx, each_value_12, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_3[i] = create_each_block_12(child_ctx);
    						each_blocks_3[i].c();
    						each_blocks_3[i].m(td2, t11);
    					}
    				}

    				for (; i < each_blocks_3.length; i += 1) {
    					each_blocks_3[i].d(1);
    				}

    				each_blocks_3.length = each_value_12.length;
    			}

    			if (dirty[0] & /*crew*/ 1) {
    				each_value_11 = /*crew*/ ctx[0].faction.startingEquipment;
    				validate_each_argument(each_value_11);
    				let i;

    				for (i = 0; i < each_value_11.length; i += 1) {
    					const child_ctx = get_each_context_11(ctx, each_value_11, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_11(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(td2, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_11.length;
    			}

    			if (dirty[0] & /*crew, selectedGrenade, grenades, selectedMeleeWeapon, meleeWeapons, selectedRangedWeapon, rangedWeapons, selectedEquipment, basicEquipment, selectedSkill*/ 3965 | dirty[2] & /*equipment*/ 4) {
    				each_value_1 = /*crew*/ ctx[0].members;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(t13.parentNode, t13);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*nonLeaders*/ 4096) {
    				each_value = /*nonLeaders*/ ctx[12];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*selectedRecruit, nonLeaders*/ 4224) {
    				select_option(select1, /*selectedRecruit*/ ctx[7]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks_4, detaching);
    			destroy_each(each_blocks_3, detaching);
    			destroy_each(each_blocks_2, detaching);
    			if (detaching) detach_dev(t12);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t18);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(t22);
    			if (detaching) detach_dev(button3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NewCrew", slots, []);
    	let { crew } = $$props;
    	let { show } = $$props;
    	let basicEquipment = equipment.filter(e => e.category == "basic");
    	let rangedWeapons = weapons.filter(w => w.category != "grenade").filter(w => w.range.max != 0);
    	let meleeWeapons = weapons.filter(w => w.category != "grenade").filter(w => w.range.min == 0);
    	let grenades = weapons.filter(w => w.category == "grenade");
    	let nonLeaders = recruits.filter(r => r.name != "Leader");
    	let selectedSkill;
    	let selectedEquipment;
    	let selectedRangedWeapon;
    	let selectedMeleeWeapon;
    	let selectedGrenade;
    	let selectedRecruit;

    	function saveCrew() {
    		var index = store.crews.findIndex(c => c.id == crew.id);

    		if (index != -1) {
    			store.crews.splice(index, 1, crew);
    		} else {
    			store.crews.push(crew);
    		}

    		store.save(store.crews);
    	}

    	const writable_props = ["crew", "show"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<NewCrew> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		crew.name = this.value;
    		$$invalidate(0, crew);
    	}

    	function select0_change_handler() {
    		crew.faction.id = select_value(this);
    		$$invalidate(0, crew);
    	}

    	const change_handler = () => $$invalidate(0, crew = crewBuilder.changeFaction(crew.faction.id, crew));

    	function input0_input_handler(each_value_1, member_index) {
    		each_value_1[member_index].name = this.value;
    		$$invalidate(0, crew);
    	}

    	function input1_input_handler(each_value_1, member_index) {
    		each_value_1[member_index].movement = to_number(this.value);
    		$$invalidate(0, crew);
    	}

    	const change_handler_1 = () => $$invalidate(0, crew = crewBuilder.updateK(crew));

    	function input2_input_handler(each_value_1, member_index) {
    		each_value_1[member_index].combatAbility = to_number(this.value);
    		$$invalidate(0, crew);
    	}

    	const change_handler_2 = () => $$invalidate(0, crew = crewBuilder.updateK(crew));

    	function input3_input_handler(each_value_1, member_index) {
    		each_value_1[member_index].will = to_number(this.value);
    		$$invalidate(0, crew);
    	}

    	const change_handler_3 = () => $$invalidate(0, crew = crewBuilder.updateK(crew));
    	const click_handler = member => $$invalidate(0, crew = crewBuilder.removeSkill(equipment, member, crew));

    	function select_change_handler() {
    		selectedSkill = select_value(this);
    		$$invalidate(2, selectedSkill);
    	}

    	const click_handler_1 = member => $$invalidate(0, crew = crewBuilder.addSkill(selectedSkill, member, crew));
    	const click_handler_2 = (equipment, member) => $$invalidate(0, crew = crewBuilder.removeEquipment(equipment, member, crew));

    	function select_change_handler_1() {
    		selectedEquipment = select_value(this);
    		$$invalidate(3, selectedEquipment);
    		$$invalidate(8, basicEquipment);
    	}

    	const click_handler_3 = member => $$invalidate(0, crew = crewBuilder.addBasicEquipment(selectedEquipment, member, crew));

    	function select_change_handler_2() {
    		selectedRangedWeapon = select_value(this);
    		$$invalidate(4, selectedRangedWeapon);
    		$$invalidate(9, rangedWeapons);
    	}

    	const click_handler_4 = member => $$invalidate(0, crew = crewBuilder.addRangedWeapon(selectedRangedWeapon, member, crew));

    	function select_change_handler_3() {
    		selectedMeleeWeapon = select_value(this);
    		$$invalidate(5, selectedMeleeWeapon);
    		$$invalidate(10, meleeWeapons);
    	}

    	const click_handler_5 = member => $$invalidate(0, crew = crewBuilder.addMeleeWeapon(selectedMeleeWeapon, member, crew));

    	function select_change_handler_4() {
    		selectedGrenade = select_value(this);
    		$$invalidate(6, selectedGrenade);
    		$$invalidate(11, grenades);
    	}

    	const click_handler_6 = member => $$invalidate(0, crew = crewBuilder.addGrenade(selectedGrenade, member, crew));

    	function select1_change_handler() {
    		selectedRecruit = select_value(this);
    		$$invalidate(7, selectedRecruit);
    		$$invalidate(12, nonLeaders);
    	}

    	const click_handler_7 = () => $$invalidate(0, crew = crewBuilder.addRecruit(selectedRecruit, crew));
    	const click_handler_8 = () => console.log(crew);
    	const click_handler_9 = () => $$invalidate(1, show = false);

    	$$self.$$set = $$props => {
    		if ("crew" in $$props) $$invalidate(0, crew = $$props.crew);
    		if ("show" in $$props) $$invalidate(1, show = $$props.show);
    	};

    	$$self.$capture_state = () => ({
    		recruits,
    		skills,
    		equipment,
    		weapons,
    		factions,
    		store,
    		crewBuilder,
    		crew,
    		show,
    		basicEquipment,
    		rangedWeapons,
    		meleeWeapons,
    		grenades,
    		nonLeaders,
    		selectedSkill,
    		selectedEquipment,
    		selectedRangedWeapon,
    		selectedMeleeWeapon,
    		selectedGrenade,
    		selectedRecruit,
    		saveCrew
    	});

    	$$self.$inject_state = $$props => {
    		if ("crew" in $$props) $$invalidate(0, crew = $$props.crew);
    		if ("show" in $$props) $$invalidate(1, show = $$props.show);
    		if ("basicEquipment" in $$props) $$invalidate(8, basicEquipment = $$props.basicEquipment);
    		if ("rangedWeapons" in $$props) $$invalidate(9, rangedWeapons = $$props.rangedWeapons);
    		if ("meleeWeapons" in $$props) $$invalidate(10, meleeWeapons = $$props.meleeWeapons);
    		if ("grenades" in $$props) $$invalidate(11, grenades = $$props.grenades);
    		if ("nonLeaders" in $$props) $$invalidate(12, nonLeaders = $$props.nonLeaders);
    		if ("selectedSkill" in $$props) $$invalidate(2, selectedSkill = $$props.selectedSkill);
    		if ("selectedEquipment" in $$props) $$invalidate(3, selectedEquipment = $$props.selectedEquipment);
    		if ("selectedRangedWeapon" in $$props) $$invalidate(4, selectedRangedWeapon = $$props.selectedRangedWeapon);
    		if ("selectedMeleeWeapon" in $$props) $$invalidate(5, selectedMeleeWeapon = $$props.selectedMeleeWeapon);
    		if ("selectedGrenade" in $$props) $$invalidate(6, selectedGrenade = $$props.selectedGrenade);
    		if ("selectedRecruit" in $$props) $$invalidate(7, selectedRecruit = $$props.selectedRecruit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		crew,
    		show,
    		selectedSkill,
    		selectedEquipment,
    		selectedRangedWeapon,
    		selectedMeleeWeapon,
    		selectedGrenade,
    		selectedRecruit,
    		basicEquipment,
    		rangedWeapons,
    		meleeWeapons,
    		grenades,
    		nonLeaders,
    		saveCrew,
    		input_input_handler,
    		select0_change_handler,
    		change_handler,
    		input0_input_handler,
    		input1_input_handler,
    		change_handler_1,
    		input2_input_handler,
    		change_handler_2,
    		input3_input_handler,
    		change_handler_3,
    		click_handler,
    		select_change_handler,
    		click_handler_1,
    		click_handler_2,
    		select_change_handler_1,
    		click_handler_3,
    		select_change_handler_2,
    		click_handler_4,
    		select_change_handler_3,
    		click_handler_5,
    		select_change_handler_4,
    		click_handler_6,
    		select1_change_handler,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9
    	];
    }

    class NewCrew extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { crew: 0, show: 1 }, [-1, -1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NewCrew",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*crew*/ ctx[0] === undefined && !("crew" in props)) {
    			console_1.warn("<NewCrew> was created without expected prop 'crew'");
    		}

    		if (/*show*/ ctx[1] === undefined && !("show" in props)) {
    			console_1.warn("<NewCrew> was created without expected prop 'show'");
    		}
    	}

    	get crew() {
    		throw new Error("<NewCrew>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set crew(value) {
    		throw new Error("<NewCrew>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get show() {
    		throw new Error("<NewCrew>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<NewCrew>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ViewCrew.svelte generated by Svelte v3.31.2 */
    const file$3 = "src/ViewCrew.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    function get_each_context_3$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	return child_ctx;
    }

    function get_each_context_4$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	return child_ctx;
    }

    function get_each_context_5$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	return child_ctx;
    }

    function get_each_context_6$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[32] = list[i].type;
    	child_ctx[33] = list[i].value;
    	child_ctx[34] = list[i].times;
    	return child_ctx;
    }

    // (50:91) 
    function create_if_block_4$1(ctx) {
    	let t0;
    	let t1_value = /*times*/ ctx[34] + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			t0 = text("on ");
    			t1 = text(t1_value);
    			t2 = text(" occasions");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 2 && t1_value !== (t1_value = /*times*/ ctx[34] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(50:91) ",
    		ctx
    	});

    	return block;
    }

    // (50:38) {#if times == -2}
    function create_if_block_3$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("once every visit");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(50:38) {#if times == -2}",
    		ctx
    	});

    	return block;
    }

    // (48:6) {#each crew.faction.discounts as {type, value, times}}
    function create_each_block_6$1(ctx) {
    	let div;
    	let t0_value = /*value*/ ctx[33] + "";
    	let t0;
    	let t1;
    	let t2_value = /*type*/ ctx[32] + "";
    	let t2;
    	let t3;
    	let t4;

    	function select_block_type(ctx, dirty) {
    		if (/*times*/ ctx[34] == -2) return create_if_block_3$1;
    		if (/*times*/ ctx[34] > 0) return create_if_block_4$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = text("% discount on ");
    			t2 = text(t2_value);
    			t3 = space();
    			if (if_block) if_block.c();
    			t4 = text(" at The Stalls.");
    			attr_dev(div, "class", "svelte-1kqqn0i");
    			add_location(div, file$3, 48, 8, 1365);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			append_dev(div, t3);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 2 && t0_value !== (t0_value = /*value*/ ctx[33] + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*crew*/ 2 && t2_value !== (t2_value = /*type*/ ctx[32] + "")) set_data_dev(t2, t2_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, t4);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (if_block) {
    				if_block.d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_6$1.name,
    		type: "each",
    		source: "(48:6) {#each crew.faction.discounts as {type, value, times}}",
    		ctx
    	});

    	return block;
    }

    // (53:6) {#each crew.faction.startingEquipment as equipment}
    function create_each_block_5$1(ctx) {
    	let div;
    	let span;
    	let t0_value = /*equipment*/ ctx[24].name + "";
    	let t0;
    	let t1;
    	let t2;
    	let t3_value = /*equipment*/ ctx[24].description + "";
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = text(":");
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = space();
    			attr_dev(span, "class", "listHeader svelte-1kqqn0i");
    			add_location(span, file$3, 54, 10, 1614);
    			attr_dev(div, "class", "svelte-1kqqn0i");
    			add_location(div, file$3, 53, 8, 1598);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(div, t2);
    			append_dev(div, t3);
    			append_dev(div, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 2 && t0_value !== (t0_value = /*equipment*/ ctx[24].name + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*crew*/ 2 && t3_value !== (t3_value = /*equipment*/ ctx[24].description + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5$1.name,
    		type: "each",
    		source: "(53:6) {#each crew.faction.startingEquipment as equipment}",
    		ctx
    	});

    	return block;
    }

    // (92:8) {#each member.skills as skill}
    function create_each_block_4$1(ctx) {
    	let div;
    	let span;
    	let t0_value = /*skill*/ ctx[27].name + "";
    	let t0;
    	let t1;
    	let t2;
    	let t3_value = /*skill*/ ctx[27].description + "";
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = text(":");
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = space();
    			attr_dev(span, "class", "listHeader svelte-1kqqn0i");
    			add_location(span, file$3, 93, 12, 2499);
    			attr_dev(div, "class", "svelte-1kqqn0i");
    			add_location(div, file$3, 92, 10, 2481);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(div, t2);
    			append_dev(div, t3);
    			append_dev(div, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 2 && t0_value !== (t0_value = /*skill*/ ctx[27].name + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*crew*/ 2 && t3_value !== (t3_value = /*skill*/ ctx[27].description + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4$1.name,
    		type: "each",
    		source: "(92:8) {#each member.skills as skill}",
    		ctx
    	});

    	return block;
    }

    // (104:8) {#each member.equipment as equipment}
    function create_each_block_3$1(ctx) {
    	let div;
    	let span;
    	let t0_value = /*equipment*/ ctx[24].name + "";
    	let t0;
    	let t1;
    	let t2;
    	let t3_value = /*equipment*/ ctx[24].description + "";
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = text(":");
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = space();
    			attr_dev(span, "class", "listHeader svelte-1kqqn0i");
    			add_location(span, file$3, 105, 12, 2821);
    			attr_dev(div, "class", "svelte-1kqqn0i");
    			add_location(div, file$3, 104, 10, 2803);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(div, t2);
    			append_dev(div, t3);
    			append_dev(div, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 2 && t0_value !== (t0_value = /*equipment*/ ctx[24].name + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*crew*/ 2 && t3_value !== (t3_value = /*equipment*/ ctx[24].description + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3$1.name,
    		type: "each",
    		source: "(104:8) {#each member.equipment as equipment}",
    		ctx
    	});

    	return block;
    }

    // (121:36) {#if weapon.firepower.per}
    function create_if_block_2$1(ctx) {
    	let t0;
    	let t1_value = /*weapon*/ ctx[18].firepower.per + "";
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("/");
    			t1 = text(t1_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 2 && t1_value !== (t1_value = /*weapon*/ ctx[18].firepower.per + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(121:36) {#if weapon.firepower.per}",
    		ctx
    	});

    	return block;
    }

    // (123:10) {#if weapon.damage.template}
    function create_if_block_1$1(ctx) {
    	let t0_value = /*weapon*/ ctx[18].damage.template + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text(", ");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 2 && t0_value !== (t0_value = /*weapon*/ ctx[18].damage.template + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(123:10) {#if weapon.damage.template}",
    		ctx
    	});

    	return block;
    }

    // (123:90) {#if weapon.damage.per}
    function create_if_block$1(ctx) {
    	let t0;
    	let t1_value = /*weapon*/ ctx[18].damage.per + "";
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("/");
    			t1 = text(t1_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 2 && t1_value !== (t1_value = /*weapon*/ ctx[18].damage.per + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(123:90) {#if weapon.damage.per}",
    		ctx
    	});

    	return block;
    }

    // (124:10) {#each weapon.rules as rule}
    function create_each_block_2$1(ctx) {
    	let t0_value = /*rule*/ ctx[21] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text(",");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 2 && t0_value !== (t0_value = /*rule*/ ctx[21] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(124:10) {#each weapon.rules as rule}",
    		ctx
    	});

    	return block;
    }

    // (117:4) {#each member.weapons as weapon}
    function create_each_block_1$2(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*weapon*/ ctx[18].name + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*weapon*/ ctx[18].range.min + "";
    	let t2;
    	let t3;
    	let t4_value = /*weapon*/ ctx[18].range.max + "";
    	let t4;
    	let t5;
    	let td2;
    	let t6_value = /*weapon*/ ctx[18].firepower.value + "";
    	let t6;
    	let t7;
    	let td3;
    	let t8_value = /*weapon*/ ctx[18].damage.value + "";
    	let t8;
    	let t9;
    	let if_block0 = /*weapon*/ ctx[18].firepower.per && create_if_block_2$1(ctx);
    	let if_block1 = /*weapon*/ ctx[18].damage.template && create_if_block_1$1(ctx);
    	let if_block2 = /*weapon*/ ctx[18].damage.per && create_if_block$1(ctx);
    	let each_value_2 = /*weapon*/ ctx[18].rules;
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = text(" - ");
    			t4 = text(t4_value);
    			t5 = space();
    			td2 = element("td");
    			t6 = text(t6_value);
    			if (if_block0) if_block0.c();
    			t7 = space();
    			td3 = element("td");
    			if (if_block1) if_block1.c();
    			t8 = text(t8_value);
    			if (if_block2) if_block2.c();
    			t9 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(td0, "class", "svelte-1kqqn0i");
    			add_location(td0, file$3, 118, 8, 3120);
    			attr_dev(td1, "class", "svelte-1kqqn0i");
    			add_location(td1, file$3, 119, 8, 3151);
    			attr_dev(td2, "class", "svelte-1kqqn0i");
    			add_location(td2, file$3, 120, 8, 3208);
    			attr_dev(td3, "class", "svelte-1kqqn0i");
    			add_location(td3, file$3, 121, 8, 3304);
    			add_location(tr, file$3, 117, 6, 3107);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(td1, t3);
    			append_dev(td1, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td2);
    			append_dev(td2, t6);
    			if (if_block0) if_block0.m(td2, null);
    			append_dev(tr, t7);
    			append_dev(tr, td3);
    			if (if_block1) if_block1.m(td3, null);
    			append_dev(td3, t8);
    			if (if_block2) if_block2.m(td3, null);
    			append_dev(td3, t9);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(td3, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 2 && t0_value !== (t0_value = /*weapon*/ ctx[18].name + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*crew*/ 2 && t2_value !== (t2_value = /*weapon*/ ctx[18].range.min + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*crew*/ 2 && t4_value !== (t4_value = /*weapon*/ ctx[18].range.max + "")) set_data_dev(t4, t4_value);
    			if (dirty[0] & /*crew*/ 2 && t6_value !== (t6_value = /*weapon*/ ctx[18].firepower.value + "")) set_data_dev(t6, t6_value);

    			if (/*weapon*/ ctx[18].firepower.per) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					if_block0.m(td2, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*weapon*/ ctx[18].damage.template) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					if_block1.m(td3, t8);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty[0] & /*crew*/ 2 && t8_value !== (t8_value = /*weapon*/ ctx[18].damage.value + "")) set_data_dev(t8, t8_value);

    			if (/*weapon*/ ctx[18].damage.per) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block$1(ctx);
    					if_block2.c();
    					if_block2.m(td3, t9);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty[0] & /*crew*/ 2) {
    				each_value_2 = /*weapon*/ ctx[18].rules;
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(td3, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(117:4) {#each member.weapons as weapon}",
    		ctx
    	});

    	return block;
    }

    // (61:0) {#each crew.members as member}
    function create_each_block$3(ctx) {
    	let table;
    	let tr0;
    	let th0;
    	let t1;
    	let td0;
    	let t2_value = /*member*/ ctx[15].name + "";
    	let t2;
    	let t3;
    	let th1;
    	let t5;
    	let td1;
    	let t6_value = /*crew*/ ctx[1].faction.name + "";
    	let t6;
    	let t7;
    	let tr1;
    	let th2;
    	let t9;
    	let td2;
    	let t10_value = /*member*/ ctx[15].wounds + "";
    	let t10;
    	let t11;
    	let th3;
    	let t13;
    	let td3;
    	let t14_value = /*member*/ ctx[15].cost + "";
    	let t14;
    	let t15;
    	let tr2;
    	let th4;
    	let t17;
    	let th5;
    	let t19;
    	let th6;
    	let t21;
    	let th7;
    	let t23;
    	let tr3;
    	let td4;
    	let t24_value = /*member*/ ctx[15].movement + "";
    	let t24;
    	let t25;
    	let td5;
    	let t26_value = /*member*/ ctx[15].combatAbility + "";
    	let t26;
    	let t27;
    	let td6;
    	let t28_value = /*member*/ ctx[15].armor + "";
    	let t28;
    	let t29;
    	let td7;
    	let t30_value = /*member*/ ctx[15].will + "";
    	let t30;
    	let t31;
    	let tr4;
    	let th8;
    	let t33;
    	let tr5;
    	let td8;
    	let t34;
    	let tr6;
    	let th9;
    	let t36;
    	let tr7;
    	let td9;
    	let t37;
    	let tr8;
    	let th10;
    	let t39;
    	let th11;
    	let t41;
    	let th12;
    	let t43;
    	let th13;
    	let t45;
    	let each_value_4 = /*member*/ ctx[15].skills;
    	validate_each_argument(each_value_4);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks_2[i] = create_each_block_4$1(get_each_context_4$1(ctx, each_value_4, i));
    	}

    	let each_value_3 = /*member*/ ctx[15].equipment;
    	validate_each_argument(each_value_3);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_1[i] = create_each_block_3$1(get_each_context_3$1(ctx, each_value_3, i));
    	}

    	let each_value_1 = /*member*/ ctx[15].weapons;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "Name";
    			t1 = space();
    			td0 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			th1 = element("th");
    			th1.textContent = "Faction";
    			t5 = space();
    			td1 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			tr1 = element("tr");
    			th2 = element("th");
    			th2.textContent = "Wounds";
    			t9 = space();
    			td2 = element("td");
    			t10 = text(t10_value);
    			t11 = space();
    			th3 = element("th");
    			th3.textContent = "Combat Experience";
    			t13 = space();
    			td3 = element("td");
    			t14 = text(t14_value);
    			t15 = space();
    			tr2 = element("tr");
    			th4 = element("th");
    			th4.textContent = "Movement";
    			t17 = space();
    			th5 = element("th");
    			th5.textContent = "Combat Ability";
    			t19 = space();
    			th6 = element("th");
    			th6.textContent = "Armor";
    			t21 = space();
    			th7 = element("th");
    			th7.textContent = "Will";
    			t23 = space();
    			tr3 = element("tr");
    			td4 = element("td");
    			t24 = text(t24_value);
    			t25 = space();
    			td5 = element("td");
    			t26 = text(t26_value);
    			t27 = space();
    			td6 = element("td");
    			t28 = text(t28_value);
    			t29 = space();
    			td7 = element("td");
    			t30 = text(t30_value);
    			t31 = space();
    			tr4 = element("tr");
    			th8 = element("th");
    			th8.textContent = "Skills";
    			t33 = space();
    			tr5 = element("tr");
    			td8 = element("td");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t34 = space();
    			tr6 = element("tr");
    			th9 = element("th");
    			th9.textContent = "Equipment";
    			t36 = space();
    			tr7 = element("tr");
    			td9 = element("td");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t37 = space();
    			tr8 = element("tr");
    			th10 = element("th");
    			th10.textContent = "Weapon Type";
    			t39 = space();
    			th11 = element("th");
    			th11.textContent = "Range";
    			t41 = space();
    			th12 = element("th");
    			th12.textContent = "Firepower";
    			t43 = space();
    			th13 = element("th");
    			th13.textContent = "Damage";
    			t45 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(th0, "class", "svelte-1kqqn0i");
    			add_location(th0, file$3, 63, 6, 1800);
    			attr_dev(td0, "class", "svelte-1kqqn0i");
    			add_location(td0, file$3, 64, 6, 1820);
    			attr_dev(th1, "class", "svelte-1kqqn0i");
    			add_location(th1, file$3, 65, 6, 1849);
    			attr_dev(td1, "class", "svelte-1kqqn0i");
    			add_location(td1, file$3, 66, 6, 1872);
    			add_location(tr0, file$3, 62, 4, 1789);
    			attr_dev(th2, "class", "svelte-1kqqn0i");
    			add_location(th2, file$3, 69, 6, 1926);
    			attr_dev(td2, "class", "svelte-1kqqn0i");
    			add_location(td2, file$3, 70, 6, 1948);
    			attr_dev(th3, "class", "svelte-1kqqn0i");
    			add_location(th3, file$3, 71, 6, 1979);
    			attr_dev(td3, "class", "svelte-1kqqn0i");
    			add_location(td3, file$3, 72, 6, 2012);
    			add_location(tr1, file$3, 68, 4, 1915);
    			attr_dev(th4, "class", "svelte-1kqqn0i");
    			add_location(th4, file$3, 75, 6, 2060);
    			attr_dev(th5, "class", "svelte-1kqqn0i");
    			add_location(th5, file$3, 76, 6, 2084);
    			attr_dev(th6, "class", "svelte-1kqqn0i");
    			add_location(th6, file$3, 77, 6, 2114);
    			attr_dev(th7, "class", "svelte-1kqqn0i");
    			add_location(th7, file$3, 78, 6, 2135);
    			add_location(tr2, file$3, 74, 4, 2049);
    			attr_dev(td4, "class", "svelte-1kqqn0i");
    			add_location(td4, file$3, 81, 6, 2174);
    			attr_dev(td5, "class", "svelte-1kqqn0i");
    			add_location(td5, file$3, 82, 6, 2207);
    			attr_dev(td6, "class", "svelte-1kqqn0i");
    			add_location(td6, file$3, 83, 6, 2245);
    			attr_dev(td7, "class", "svelte-1kqqn0i");
    			add_location(td7, file$3, 84, 6, 2275);
    			add_location(tr3, file$3, 80, 4, 2163);
    			attr_dev(th8, "class", "wide svelte-1kqqn0i");
    			attr_dev(th8, "colspan", "4");
    			add_location(th8, file$3, 87, 6, 2323);
    			add_location(tr4, file$3, 86, 4, 2312);
    			attr_dev(td8, "class", "wide svelte-1kqqn0i");
    			attr_dev(td8, "colspan", "4");
    			add_location(td8, file$3, 90, 6, 2402);
    			attr_dev(tr5, "class", "list svelte-1kqqn0i");
    			add_location(tr5, file$3, 89, 4, 2378);
    			attr_dev(th9, "class", "wide svelte-1kqqn0i");
    			attr_dev(th9, "colspan", "4");
    			add_location(th9, file$3, 99, 6, 2635);
    			add_location(tr6, file$3, 98, 4, 2624);
    			attr_dev(td9, "class", "wide svelte-1kqqn0i");
    			attr_dev(td9, "colspan", "4");
    			add_location(td9, file$3, 102, 6, 2717);
    			attr_dev(tr7, "class", "list svelte-1kqqn0i");
    			add_location(tr7, file$3, 101, 4, 2693);
    			attr_dev(th10, "class", "svelte-1kqqn0i");
    			add_location(th10, file$3, 111, 6, 2965);
    			attr_dev(th11, "class", "svelte-1kqqn0i");
    			add_location(th11, file$3, 112, 6, 2992);
    			attr_dev(th12, "class", "svelte-1kqqn0i");
    			add_location(th12, file$3, 113, 6, 3013);
    			attr_dev(th13, "class", "svelte-1kqqn0i");
    			add_location(th13, file$3, 114, 6, 3038);
    			add_location(tr8, file$3, 110, 4, 2954);
    			attr_dev(table, "class", "svelte-1kqqn0i");
    			add_location(table, file$3, 61, 2, 1777);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t1);
    			append_dev(tr0, td0);
    			append_dev(td0, t2);
    			append_dev(tr0, t3);
    			append_dev(tr0, th1);
    			append_dev(tr0, t5);
    			append_dev(tr0, td1);
    			append_dev(td1, t6);
    			append_dev(table, t7);
    			append_dev(table, tr1);
    			append_dev(tr1, th2);
    			append_dev(tr1, t9);
    			append_dev(tr1, td2);
    			append_dev(td2, t10);
    			append_dev(tr1, t11);
    			append_dev(tr1, th3);
    			append_dev(tr1, t13);
    			append_dev(tr1, td3);
    			append_dev(td3, t14);
    			append_dev(table, t15);
    			append_dev(table, tr2);
    			append_dev(tr2, th4);
    			append_dev(tr2, t17);
    			append_dev(tr2, th5);
    			append_dev(tr2, t19);
    			append_dev(tr2, th6);
    			append_dev(tr2, t21);
    			append_dev(tr2, th7);
    			append_dev(table, t23);
    			append_dev(table, tr3);
    			append_dev(tr3, td4);
    			append_dev(td4, t24);
    			append_dev(tr3, t25);
    			append_dev(tr3, td5);
    			append_dev(td5, t26);
    			append_dev(tr3, t27);
    			append_dev(tr3, td6);
    			append_dev(td6, t28);
    			append_dev(tr3, t29);
    			append_dev(tr3, td7);
    			append_dev(td7, t30);
    			append_dev(table, t31);
    			append_dev(table, tr4);
    			append_dev(tr4, th8);
    			append_dev(table, t33);
    			append_dev(table, tr5);
    			append_dev(tr5, td8);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(td8, null);
    			}

    			append_dev(table, t34);
    			append_dev(table, tr6);
    			append_dev(tr6, th9);
    			append_dev(table, t36);
    			append_dev(table, tr7);
    			append_dev(tr7, td9);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(td9, null);
    			}

    			append_dev(table, t37);
    			append_dev(table, tr8);
    			append_dev(tr8, th10);
    			append_dev(tr8, t39);
    			append_dev(tr8, th11);
    			append_dev(tr8, t41);
    			append_dev(tr8, th12);
    			append_dev(tr8, t43);
    			append_dev(tr8, th13);
    			append_dev(table, t45);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 2 && t2_value !== (t2_value = /*member*/ ctx[15].name + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*crew*/ 2 && t6_value !== (t6_value = /*crew*/ ctx[1].faction.name + "")) set_data_dev(t6, t6_value);
    			if (dirty[0] & /*crew*/ 2 && t10_value !== (t10_value = /*member*/ ctx[15].wounds + "")) set_data_dev(t10, t10_value);
    			if (dirty[0] & /*crew*/ 2 && t14_value !== (t14_value = /*member*/ ctx[15].cost + "")) set_data_dev(t14, t14_value);
    			if (dirty[0] & /*crew*/ 2 && t24_value !== (t24_value = /*member*/ ctx[15].movement + "")) set_data_dev(t24, t24_value);
    			if (dirty[0] & /*crew*/ 2 && t26_value !== (t26_value = /*member*/ ctx[15].combatAbility + "")) set_data_dev(t26, t26_value);
    			if (dirty[0] & /*crew*/ 2 && t28_value !== (t28_value = /*member*/ ctx[15].armor + "")) set_data_dev(t28, t28_value);
    			if (dirty[0] & /*crew*/ 2 && t30_value !== (t30_value = /*member*/ ctx[15].will + "")) set_data_dev(t30, t30_value);

    			if (dirty[0] & /*crew*/ 2) {
    				each_value_4 = /*member*/ ctx[15].skills;
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4$1(ctx, each_value_4, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_4$1(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(td8, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_4.length;
    			}

    			if (dirty[0] & /*crew*/ 2) {
    				each_value_3 = /*member*/ ctx[15].equipment;
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3$1(ctx, each_value_3, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_3$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(td9, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_3.length;
    			}

    			if (dirty[0] & /*crew*/ 2) {
    				each_value_1 = /*member*/ ctx[15].weapons;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(61:0) {#each crew.members as member}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let t0;
    	let t1_value = /*crew*/ ctx[1].k + "";
    	let t1;
    	let t2;
    	let table;
    	let tr0;
    	let th0;
    	let t4;
    	let td0;
    	let t5_value = /*crew*/ ctx[1].name + "";
    	let t5;
    	let t6;
    	let th1;
    	let t8;
    	let td1;
    	let t9_value = /*crew*/ ctx[1].faction.name + "";
    	let t9;
    	let t10;
    	let tr1;
    	let th2;
    	let t12;
    	let tr2;
    	let td2;
    	let t13;
    	let t14;
    	let t15;
    	let button;
    	let mounted;
    	let dispose;
    	let each_value_6 = /*crew*/ ctx[1].faction.discounts;
    	validate_each_argument(each_value_6);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_6.length; i += 1) {
    		each_blocks_2[i] = create_each_block_6$1(get_each_context_6$1(ctx, each_value_6, i));
    	}

    	let each_value_5 = /*crew*/ ctx[1].faction.startingEquipment;
    	validate_each_argument(each_value_5);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks_1[i] = create_each_block_5$1(get_each_context_5$1(ctx, each_value_5, i));
    	}

    	let each_value = /*crew*/ ctx[1].members;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("K:");
    			t1 = text(t1_value);
    			t2 = space();
    			table = element("table");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "Crew Name";
    			t4 = space();
    			td0 = element("td");
    			t5 = text(t5_value);
    			t6 = space();
    			th1 = element("th");
    			th1.textContent = "Faction";
    			t8 = space();
    			td1 = element("td");
    			t9 = text(t9_value);
    			t10 = space();
    			tr1 = element("tr");
    			th2 = element("th");
    			th2.textContent = "Notes";
    			t12 = space();
    			tr2 = element("tr");
    			td2 = element("td");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t13 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t14 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t15 = space();
    			button = element("button");
    			button.textContent = "Back";
    			attr_dev(div, "class", "svelte-1kqqn0i");
    			add_location(div, file$3, 34, 0, 1036);
    			attr_dev(th0, "class", "svelte-1kqqn0i");
    			add_location(th0, file$3, 37, 4, 1077);
    			attr_dev(td0, "class", "svelte-1kqqn0i");
    			add_location(td0, file$3, 38, 4, 1100);
    			attr_dev(th1, "class", "svelte-1kqqn0i");
    			add_location(th1, file$3, 39, 4, 1125);
    			attr_dev(td1, "class", "svelte-1kqqn0i");
    			add_location(td1, file$3, 40, 4, 1146);
    			add_location(tr0, file$3, 36, 2, 1068);
    			attr_dev(th2, "class", "wide svelte-1kqqn0i");
    			attr_dev(th2, "colspan", "4");
    			add_location(th2, file$3, 43, 4, 1194);
    			add_location(tr1, file$3, 42, 2, 1185);
    			attr_dev(td2, "class", "wide svelte-1kqqn0i");
    			attr_dev(td2, "colspan", "4");
    			add_location(td2, file$3, 46, 4, 1266);
    			attr_dev(tr2, "class", "list svelte-1kqqn0i");
    			add_location(tr2, file$3, 45, 2, 1244);
    			attr_dev(table, "class", "svelte-1kqqn0i");
    			add_location(table, file$3, 35, 0, 1058);
    			add_location(button, file$3, 129, 0, 3558);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, table, anchor);
    			append_dev(table, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t4);
    			append_dev(tr0, td0);
    			append_dev(td0, t5);
    			append_dev(tr0, t6);
    			append_dev(tr0, th1);
    			append_dev(tr0, t8);
    			append_dev(tr0, td1);
    			append_dev(td1, t9);
    			append_dev(table, t10);
    			append_dev(table, tr1);
    			append_dev(tr1, th2);
    			append_dev(table, t12);
    			append_dev(table, tr2);
    			append_dev(tr2, td2);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(td2, null);
    			}

    			append_dev(td2, t13);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(td2, null);
    			}

    			insert_dev(target, t14, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t15, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*crew*/ 2 && t1_value !== (t1_value = /*crew*/ ctx[1].k + "")) set_data_dev(t1, t1_value);
    			if (dirty[0] & /*crew*/ 2 && t5_value !== (t5_value = /*crew*/ ctx[1].name + "")) set_data_dev(t5, t5_value);
    			if (dirty[0] & /*crew*/ 2 && t9_value !== (t9_value = /*crew*/ ctx[1].faction.name + "")) set_data_dev(t9, t9_value);

    			if (dirty[0] & /*crew*/ 2) {
    				each_value_6 = /*crew*/ ctx[1].faction.discounts;
    				validate_each_argument(each_value_6);
    				let i;

    				for (i = 0; i < each_value_6.length; i += 1) {
    					const child_ctx = get_each_context_6$1(ctx, each_value_6, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_6$1(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(td2, t13);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_6.length;
    			}

    			if (dirty[0] & /*crew*/ 2) {
    				each_value_5 = /*crew*/ ctx[1].faction.startingEquipment;
    				validate_each_argument(each_value_5);
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5$1(ctx, each_value_5, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_5$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(td2, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_5.length;
    			}

    			if (dirty[0] & /*crew*/ 2) {
    				each_value = /*crew*/ ctx[1].members;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t15.parentNode, t15);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t14);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ViewCrew", slots, []);
    	let { crew } = $$props;
    	let { show } = $$props;
    	let basicEquipment = equipment.filter(e => e.category == "basic");
    	let rangedWeapons = weapons.filter(w => w.category != "grenade").filter(w => w.range.max != 0);
    	let meleeWeapons = weapons.filter(w => w.category != "grenade").filter(w => w.range.min == 0);
    	let grenades = weapons.filter(w => w.category == "grenade");
    	let nonLeaders = recruits.filter(r => r.name != "Leader");
    	let selectedSkill;
    	let selectedEquipment;
    	let selectedRangedWeapon;
    	let selectedMeleeWeapon;
    	let selectedGrenade;
    	let selectedRecruit;

    	function saveCrew() {
    		var index = store.crews.findIndex(c => c.id == crew.id);

    		if (index != -1) {
    			store.crews.splice(index, 1, crew);
    		} else {
    			store.crews.push(crew);
    		}

    		store.save(store.crews);
    	}

    	const writable_props = ["crew", "show"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ViewCrew> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, show = false);

    	$$self.$$set = $$props => {
    		if ("crew" in $$props) $$invalidate(1, crew = $$props.crew);
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    	};

    	$$self.$capture_state = () => ({
    		recruits,
    		skills,
    		equipment,
    		weapons,
    		factions,
    		store,
    		crew,
    		show,
    		basicEquipment,
    		rangedWeapons,
    		meleeWeapons,
    		grenades,
    		nonLeaders,
    		selectedSkill,
    		selectedEquipment,
    		selectedRangedWeapon,
    		selectedMeleeWeapon,
    		selectedGrenade,
    		selectedRecruit,
    		saveCrew
    	});

    	$$self.$inject_state = $$props => {
    		if ("crew" in $$props) $$invalidate(1, crew = $$props.crew);
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    		if ("basicEquipment" in $$props) basicEquipment = $$props.basicEquipment;
    		if ("rangedWeapons" in $$props) rangedWeapons = $$props.rangedWeapons;
    		if ("meleeWeapons" in $$props) meleeWeapons = $$props.meleeWeapons;
    		if ("grenades" in $$props) grenades = $$props.grenades;
    		if ("nonLeaders" in $$props) nonLeaders = $$props.nonLeaders;
    		if ("selectedSkill" in $$props) selectedSkill = $$props.selectedSkill;
    		if ("selectedEquipment" in $$props) selectedEquipment = $$props.selectedEquipment;
    		if ("selectedRangedWeapon" in $$props) selectedRangedWeapon = $$props.selectedRangedWeapon;
    		if ("selectedMeleeWeapon" in $$props) selectedMeleeWeapon = $$props.selectedMeleeWeapon;
    		if ("selectedGrenade" in $$props) selectedGrenade = $$props.selectedGrenade;
    		if ("selectedRecruit" in $$props) selectedRecruit = $$props.selectedRecruit;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [show, crew, click_handler];
    }

    class ViewCrew extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { crew: 1, show: 0 }, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ViewCrew",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*crew*/ ctx[1] === undefined && !("crew" in props)) {
    			console.warn("<ViewCrew> was created without expected prop 'crew'");
    		}

    		if (/*show*/ ctx[0] === undefined && !("show" in props)) {
    			console.warn("<ViewCrew> was created without expected prop 'show'");
    		}
    	}

    	get crew() {
    		throw new Error("<ViewCrew>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set crew(value) {
    		throw new Error("<ViewCrew>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get show() {
    		throw new Error("<ViewCrew>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<ViewCrew>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Crews.svelte generated by Svelte v3.31.2 */
    const file$4 = "src/Crews.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    // (45:0) {:else}
    function create_else_block(ctx) {
    	let viewcrew;
    	let updating_show;
    	let current;

    	function viewcrew_show_binding(value) {
    		/*viewcrew_show_binding*/ ctx[12].call(null, value);
    	}

    	let viewcrew_props = { crew: /*crew*/ ctx[3] };

    	if (/*view*/ ctx[2] !== void 0) {
    		viewcrew_props.show = /*view*/ ctx[2];
    	}

    	viewcrew = new ViewCrew({ props: viewcrew_props, $$inline: true });
    	binding_callbacks.push(() => bind(viewcrew, "show", viewcrew_show_binding));

    	const block = {
    		c: function create() {
    			create_component(viewcrew.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(viewcrew, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const viewcrew_changes = {};
    			if (dirty & /*crew*/ 8) viewcrew_changes.crew = /*crew*/ ctx[3];

    			if (!updating_show && dirty & /*view*/ 4) {
    				updating_show = true;
    				viewcrew_changes.show = /*view*/ ctx[2];
    				add_flush_callback(() => updating_show = false);
    			}

    			viewcrew.$set(viewcrew_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(viewcrew.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(viewcrew.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(viewcrew, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(45:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (43:27) 
    function create_if_block_1$2(ctx) {
    	let newcrew;
    	let updating_show;
    	let current;

    	function newcrew_show_binding(value) {
    		/*newcrew_show_binding*/ ctx[11].call(null, value);
    	}

    	let newcrew_props = { crew: /*crew*/ ctx[3] };

    	if (/*newCrew*/ ctx[1] !== void 0) {
    		newcrew_props.show = /*newCrew*/ ctx[1];
    	}

    	newcrew = new NewCrew({ props: newcrew_props, $$inline: true });
    	binding_callbacks.push(() => bind(newcrew, "show", newcrew_show_binding));

    	const block = {
    		c: function create() {
    			create_component(newcrew.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(newcrew, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const newcrew_changes = {};
    			if (dirty & /*crew*/ 8) newcrew_changes.crew = /*crew*/ ctx[3];

    			if (!updating_show && dirty & /*newCrew*/ 2) {
    				updating_show = true;
    				newcrew_changes.show = /*newCrew*/ ctx[1];
    				add_flush_callback(() => updating_show = false);
    			}

    			newcrew.$set(newcrew_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(newcrew.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(newcrew.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(newcrew, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(43:27) ",
    		ctx
    	});

    	return block;
    }

    // (32:0) {#if !newCrew && !view}
    function create_if_block$2(ctx) {
    	let button;
    	let t1;
    	let ul;
    	let mounted;
    	let dispose;
    	let each_value = /*crewList*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Add Crew";
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(button, file$4, 32, 0, 615);
    			add_location(ul, file$4, 33, 0, 693);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*viewCrew, crewList, deleteCrew, editCrew*/ 113) {
    				each_value = /*crewList*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(32:0) {#if !newCrew && !view}",
    		ctx
    	});

    	return block;
    }

    // (35:1) {#each crewList as eCrew}
    function create_each_block$4(ctx) {
    	let li;
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let span2;
    	let t4_value = /*eCrew*/ ctx[13].name + "";
    	let t4;
    	let t5;
    	let t6_value = /*eCrew*/ ctx[13].k + "";
    	let t6;
    	let t7;
    	let t8;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[8](/*eCrew*/ ctx[13]);
    	}

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[9](/*eCrew*/ ctx[13]);
    	}

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[10](/*eCrew*/ ctx[13]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			span0 = element("span");
    			span0.textContent = "[E]";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "[D]";
    			t3 = space();
    			span2 = element("span");
    			t4 = text(t4_value);
    			t5 = text(" (");
    			t6 = text(t6_value);
    			t7 = text(" K)");
    			t8 = space();
    			add_location(span0, file$4, 36, 3, 735);
    			add_location(span1, file$4, 37, 3, 788);
    			add_location(span2, file$4, 38, 3, 843);
    			add_location(li, file$4, 35, 2, 727);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, span0);
    			append_dev(li, t1);
    			append_dev(li, span1);
    			append_dev(li, t3);
    			append_dev(li, span2);
    			append_dev(span2, t4);
    			append_dev(span2, t5);
    			append_dev(span2, t6);
    			append_dev(span2, t7);
    			append_dev(li, t8);

    			if (!mounted) {
    				dispose = [
    					listen_dev(span0, "click", click_handler_1, false, false, false),
    					listen_dev(span1, "click", click_handler_2, false, false, false),
    					listen_dev(span2, "click", click_handler_3, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*crewList*/ 1 && t4_value !== (t4_value = /*eCrew*/ ctx[13].name + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*crewList*/ 1 && t6_value !== (t6_value = /*eCrew*/ ctx[13].k + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(35:1) {#each crewList as eCrew}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_if_block_1$2, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*newCrew*/ ctx[1] && !/*view*/ ctx[2]) return 0;
    		if (/*newCrew*/ ctx[1] && !/*view*/ ctx[2]) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Crews", slots, []);
    	var crewList = store.crews;
    	var newCrew = false;
    	var view = false;
    	let crew;

    	function editCrew(c) {
    		$$invalidate(1, newCrew = true);
    		$$invalidate(3, crew = c);
    	}

    	function deleteCrew(c) {
    		var index = crewList.findIndex(cr => cr.id == c.id);

    		if (index != -1) {
    			crewList.splice(index, 1);
    		}

    		store.save(crewList);
    		$$invalidate(0, crewList = store.crews);
    	}

    	function viewCrew(c) {
    		$$invalidate(2, view = true);
    		$$invalidate(3, crew = c);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Crews> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => editCrew(crewBuilder.create("", 0));
    	const click_handler_1 = eCrew => editCrew(eCrew);
    	const click_handler_2 = eCrew => deleteCrew(eCrew);
    	const click_handler_3 = eCrew => viewCrew(eCrew);

    	function newcrew_show_binding(value) {
    		newCrew = value;
    		$$invalidate(1, newCrew);
    	}

    	function viewcrew_show_binding(value) {
    		view = value;
    		$$invalidate(2, view);
    	}

    	$$self.$capture_state = () => ({
    		NewCrew,
    		ViewCrew,
    		store,
    		crewBuilder,
    		crewList,
    		newCrew,
    		view,
    		crew,
    		editCrew,
    		deleteCrew,
    		viewCrew
    	});

    	$$self.$inject_state = $$props => {
    		if ("crewList" in $$props) $$invalidate(0, crewList = $$props.crewList);
    		if ("newCrew" in $$props) $$invalidate(1, newCrew = $$props.newCrew);
    		if ("view" in $$props) $$invalidate(2, view = $$props.view);
    		if ("crew" in $$props) $$invalidate(3, crew = $$props.crew);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		crewList,
    		newCrew,
    		view,
    		crew,
    		editCrew,
    		deleteCrew,
    		viewCrew,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		newcrew_show_binding,
    		viewcrew_show_binding
    	];
    }

    class Crews extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Crews",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.2 */
    const file$5 = "src/App.svelte";

    function create_fragment$5(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let crews;
    	let current;
    	crews = new Crews({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Zona Alfa";
    			t1 = space();
    			create_component(crews.$$.fragment);
    			attr_dev(h1, "class", "svelte-1tky8bj");
    			add_location(h1, file$5, 8, 1, 167);
    			attr_dev(main, "class", "svelte-1tky8bj");
    			add_location(main, file$5, 7, 0, 159);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			mount_component(crews, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(crews.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(crews.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(crews);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let { name } = $$props;
    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({ name, Weapons, Recruits, Crews });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
