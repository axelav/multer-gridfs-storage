import test from 'ava';
import {parse} from 'mongodb-uri';
import {
	compare,
	compareArrays,
	compareBy,
	compareUris,
	getDatabase,
	hasKeys
} from '../lib/utils';
import {createBuffer} from './utils/testutils';

/* Compare */
test('compare considers equal any falsey values', t => {
	t.true(compare(null, undefined));
	t.true(compare(undefined, null));
});

test('compare considers equal objects with no keys and falsey values', t => {
	t.true(compare(null, {}));
	t.true(compare({}, null));
	t.true(compare({}, undefined));
	t.true(compare(undefined, {}));
	t.true(compare({}, {}));
	t.true(compare({}, Object.create(null)));
});

test('compare considers different objects with keys and falsey values', t => {
	t.false(compare(null, {a: 1}));
	t.false(compare({a: 1}, null));
	t.false(compare({a: 1}, undefined));
	t.false(compare(undefined, {a: 1}));
});

test('compare considers equal objects by reference', t => {
	const ob1 = {a: 1};
	const ob2 = {b: 2};
	t.true(compare(ob1, ob1));
	t.true(compare(ob2, ob2));
});

test('compare considers equal objects with same property values', t => {
	function Obj() {
		this.a = 1;
	}

	Obj.prototype.b = 2;
	t.true(compare({a: 1}, {a: 1}));
	t.true(compare({a: 1, b: 2}, new Obj()));
});

test('compare considers different objects with different keys values', t => {
	t.false(compare({a: 1}, {b: 1}));
	t.false(compare({c: 1}, {d: 1}));
	t.false(compare({c: 1}, {}));
	t.false(compare({}, {c: 1}));
	t.false(compare({c: 1}, {c: 1, d: 1}));
});

test('compare considers different objects with different keys length', t => {
	t.false(compare({a: 1, b: 2}, {a: 1}));
});

test('compare includes deep properties when comparing', t => {
	t.true(compare({a: {b: 1}}, {a: {b: 1}}));
	t.false(compare({a: {b: 1}}, {a: {b: 2}}));
	t.true(compare({a: {}}, {a: {}}));
	t.true(compare({a: {b: {}}}, {a: {b: Object.create(null)}}));
});

test('compare includes arrays when comparing', t => {
	t.true(compare({a: {b: ['1', '2']}}, {a: {b: ['1', '2']}}));
	t.false(compare({a: {b: ['1', '2']}}, {a: {b: ['2', '2']}}));
	t.false(compare({a: {b: ['1']}}, {a: {b: ['1', '1']}}));
	t.true(compare({a: []}, {a: []}));
});

test('compare includes buffers when comparing', t => {
	t.true(
		compare({a: {b: createBuffer([1, 2])}}, {a: {b: createBuffer([1, 2])}})
	);
	t.false(
		compare({a: {b: createBuffer([1, 2])}}, {a: {b: createBuffer([2, 2])}})
	);
});

test('compare includes buffers inside arrays when comparing', t => {
	t.true(
		compare(
			{a: {b: ['1', createBuffer([1, 2])]}},
			{a: {b: ['1', createBuffer([1, 2])]}}
		)
	);
	t.false(
		compare(
			{a: {b: ['1', createBuffer([1, 2])]}},
			{a: {b: ['1', createBuffer([2, 2])]}}
		)
	);
});

/* HasKeys */
test('should return true when the object has at least one property', t => {
	t.true(hasKeys({a: 1}));
});

test('should return false when the object has no properties', t => {
	t.false(hasKeys({}));
	/* eslint-disable-next-line no-new-object */
	t.false(hasKeys(new Object()));
});

/* CompareArrays */
test('should return true when the arrays contains identical string or buffer values', t => {
	t.true(compareArrays(['a', 'b'], ['a', 'b']));
	t.true(
		compareArrays([createBuffer([1, 2]), 'b'], [createBuffer([1, 2]), 'b'])
	);
});

test('should return false when the arrays contains different values or they are compared by reference', t => {
	t.false(compareArrays(['a', 'b'], ['b', 'b']));
	t.false(compareArrays([undefined], [null]));
	t.false(compareArrays([{a: 1}], [{a: 1}]));
});

/* CompareBy */
test('should return identity when the objects have different types', t => {
	t.is(compareBy(createBuffer([1, 2]), ['a', 'b']), 'identity');
});

test('should return the type of the objects when they have the same type', t => {
	t.is(compareBy([], ['a', 'b']), 'array');
	t.is(compareBy(createBuffer([1, 2]), createBuffer(['a', 'b'])), 'buffer');
	t.is(compareBy({}, {a: 1}), 'object');
});

/* CompareUris */
test('should return true for urls that contain the same hosts in different order', t => {
	t.true(
		compareUris(
			parse('mongodb://host1:1234,host2:5678/database'),
			parse('mongodb://host2:5678,host1:1234/database')
		)
	);
});

test('should return false for urls with different parameters', t => {
	t.false(
		compareUris(
			parse('mongodb://host1:1234,host2:5678/database?authSource=admin'),
			parse('mongodb://host2:5678,host1:1234/database')
		)
	);
});

test('should return true for urls with the same parameters in different order', t => {
	t.true(
		compareUris(
			parse(
				'mongodb://host1:1234/database?authSource=admin&connectTimeoutMS=300000'
			),
			parse(
				'mongodb://host1:1234/database?connectTimeoutMS=300000&authSource=admin'
			)
		)
	);
});

/* GetDatabase */
test('should return the database object fom a mongoose instance', t => {
	const database = {};
	t.is(getDatabase({connection: {db: database}}), database);
});

test('should return the database object fom a mongoose connection instance', t => {
	const database = {};
	t.is(getDatabase({db: database}), database);
});

test('should return the database object directly if is not a mongoose object', t => {
	const database = {};
	t.is(getDatabase(database), database);
});
