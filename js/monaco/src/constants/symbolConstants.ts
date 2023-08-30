export namespace SymbolKinds {
    // types
    export const Class = 'class';
    export const Delegate = 'delegate';
    export const Enum = 'enum';
    export const Interface = 'interface';
    export const Struct = 'struct';

    // members
    export const Constant = 'constant';
    export const Constructor = 'constructor';
    export const Destructor = 'destructor';
    export const EnumMember = 'enummember';
    export const Event = 'event';
    export const Field = 'field';
    export const Indexer = 'indexer';
    export const Method = 'method';
    export const Operator = 'operator';
    export const Property = 'property';

    // other
    export const Namespace = 'namespace';
    export const Unknown = 'unknown';
}
export namespace SymbolAccessibilities {
    export const Internal = 'internal';
    export const Private = 'private';
    export const PrivateProtected = 'private protected';
    export const Protected = 'protected';
    export const ProtectedInternal = 'protected internal';
    export const Public = 'public';
}

export namespace SymbolPropertyNames {
    export const Accessibility = 'accessibility';
    export const Static = 'static';
    export const TestFramework = 'testFramework';
    export const TestMethodName = 'testMethodName';
}

export namespace SymbolRangeNames {
    export const Attributes = 'attributes';
    export const Full = 'full';
    export const Name = 'name';
}
