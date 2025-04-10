
const DayChart = ({ classes }) => {
    return (
        <div className="bar">
            {classes.map((item, index) => (
                <div className="chartItem" key={index}>
                    
                        {item}
                </div>
            ))}
        </div>
    );
};
export default DayChart;
