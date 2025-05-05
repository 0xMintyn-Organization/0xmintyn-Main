interface SnapshotComponentType {
    propsalSate: string;
    states: number | string;
}

function SnapshotComponent({ propsalSate, states }: SnapshotComponentType) {
    return(
        <div className="text-center w-1/2 lg:w-1/4">
            <p className="text-xs">{propsalSate}</p>
            <p className="text-green-700 font-semibold text-lg">{states}</p>
        </div>
    )
}

export default SnapshotComponent