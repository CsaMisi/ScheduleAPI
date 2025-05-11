namespace ScheduleAPI.Common
{
    public class Enums
    {
        public enum TaskType
        {
            Physical,
            Mental,
            FreeTime,
            Work,
            Study,
            Other
        }

        public enum TaskProgress
        {
            NotStarted,
            InProgress,
            Completed,
            OnHold,
            Cancelled
        }
    }
}
