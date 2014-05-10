/// <reference path="../../d.ts/DefinitelyTyped/jasmine/jasmine.d.ts"/>

import basilisk = require('../basilisk');

// we use this a *lot*, so simplify it here.
import SM = basilisk.SimpleStringMap;

class Sample extends basilisk.ts.Struct {
    constructor(opts:{ name:string }) {
        this.name = opts.name;
        super();
    }

    public name:string;

    public equals(other:any):boolean {
        if (this === other) {
            return true;
        }

        if (Object.getPrototypeOf(this) !== Object.getPrototypeOf(other)) {
            return false;
        }

        if (other === null || other === undefined) {
            return false;
        }

        return this.name === other.name;
    }
}

function mapOfThree():SM<Sample> {
    return SM.from({
        'a': new Sample({ name: 'a'}),
        'b': new Sample({ name: 'b'}),
        'c': new Sample({ name: 'c'})
    });
}

describe("SimpleStringMap", function () {

    function mapOfThree ():SM<Sample> {
        return SM.from({
            'a': new Sample({ name: 'a'}),
            'b': new Sample({ name: 'b'}),
            'c': new Sample({ name: 'c'})
        });
    }

    describe(".from", function () {
        it("Can be constructed from a simple hash.", function () {
            var sample = SM.from({
                'a': new Sample({ name: 'a'}),
                'b': new Sample({ name: 'b'})
            });

            expect(sample instanceof SM).toBeTruthy();
            expect(sample.get('a')).toEqual(jasmine.objectContaining({ name: 'a' }));
            expect(sample.get('b')).toEqual(jasmine.objectContaining({ name: 'b' }));
            expect(sample.get('c', null)).toBeNull();
            expect(sample.get('c', new Sample({ name: 'cat'}))).toEqual(jasmine.objectContaining({ name: 'cat' }));
        });

        it("Can be constructed from another SimpleStringMap", function () {
            var sample = SM.from({
                'a': new Sample({ name: 'a'}),
                'b': new Sample({ name: 'b'})
            }),
                alt = SM.from(sample);

            expect(sample).not.toBe(alt);
            expect(sample.get('a')).toBe(alt.get('a'));
            expect(sample.get('b')).toBe(alt.get('b'));
        });
    });

    describe('Replace functionality', function () {
        it("Can have a particular object replaced.", function () {
            var sample = mapOfThree(),
                alt = sample.set('b', new Sample({ name: 'replaced' }));

            expect(alt).not.toBe(sample);
            expect(alt.get('b')).toEqual(jasmine.objectContaining({ name: 'replaced' }));
            expect(sample.get('b')).toEqual(jasmine.objectContaining({ name: 'b' }));
        });

        it("Should be safe to use hostile names.", function () {
            var sample = mapOfThree(),
                alt = sample.set('__proto__', new Sample({ name: 'replaced' }));

            expect(alt).not.toBe(sample);
            expect(alt.get('__proto__')).toEqual(jasmine.objectContaining({ name: 'replaced' }));
            expect(sample.get('b')).toEqual(jasmine.objectContaining({ name: 'b' }));
        });
    });

    describe("Get functionality", function () {
        it("Should be able to retrieve objects by id.", function () {
            var sample = mapOfThree();

            expect(sample.get('a').name).toBe('a');
        });

        it("Should be able to retrieve default objects, if the actual object is not there..", function () {
            var sample = mapOfThree();

            expect(sample.get('j', new Sample({ name: 'cat' }))).toEqual(jasmine.objectContaining({ name: 'cat' }));
        })
    });

    describe("Has functionality", function () {
        it("Can check basic objects via has.", function () {
            var sample = mapOfThree();

            expect(sample.has('a')).toBe(true);
            expect(sample.has('b')).toBe(true);
            expect(sample.has('c')).toBe(true);
            expect(sample.has('d')).toBe(false);
        });
    });
    describe("forEach functionality", function () {
        it("Basic count behaviour", function () {
            var sample = mapOfThree(),
                seen = {},
                count = 0;

            sample.forEach(function (value:Sample, key:string) {
                count += 1;
                seen[value.name] = true;
                expect(key).toBe(value.name);
            });

            expect(count).toBe(3);
            expect(seen['a']).toBeTruthy();
            expect(seen['b']).toBeTruthy();
            expect(seen['c']).toBeTruthy();
            expect(seen['d']).not.toBeTruthy();
        })
    });

    describe("Equality functionality", function () {
        it("Should be equal to itself", function () {
            var m = basilisk.SimpleStringMap.from({
                'a': 'test'
            });

            expect(m.equals(m)).toBe(true);
        });

        it("Should not be equal if a key is different.", function () {
            var a = basilisk.SimpleStringMap.from<string>({
                'a': 'test'
            }), b = basilisk.SimpleStringMap.from<string>({
                    'a': 'different'
                });

            expect(a.equals(b)).toBe(false);
        });


        it("Should not be equal if an extra key is present in other.", function () {
            var a = basilisk.SimpleStringMap.from<string>({
                    'a': 'test'
                }), b = basilisk.SimpleStringMap.from<string>({
                    'a': 'test',
                    'b': 'different'
                })
                ;

            expect(a.equals(b)).toBe(false);
        });

        it("Should be equal across multiple items.", function () {
            var a = basilisk.SimpleStringMap.from<string>({
                    'a': 'test',
                    'b': 'same'
                }),
                b = basilisk.SimpleStringMap.from<string>({
                    'a': 'test',
                    'b': 'same'
                });

            expect(a.equals(b)).toBe(true);
        });


        it("Should be equal for complex children with equality defined.", function () {
            var a = basilisk.SimpleStringMap.from({
                    'a': new Sample({ name: 'test' })
                }),
                b = basilisk.SimpleStringMap.from<string>({
                    'a': new Sample({ name: 'test' })
                });

            expect(a.equals(b)).toBe(true);
        });
    });

    describe("Remove functionality", function () {
        it("Should remove keys if they are present.", function () {
            var sample = basilisk.SimpleStringMap.from<string>({
                'a': 'hello',
                'b': 'goodbye'
            }),
                changed = sample.remove('a');

            expect(sample.get('a')).toBe('hello');
            expect(changed.get('a')).toBe(null);
            expect(changed.get('b')).toBe('goodbye');
        });
    });

});

