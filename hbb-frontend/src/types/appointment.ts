// Define the types of the item properties
interface Date {
  day: string;
  no: string;
}

interface Details {
  name: string;
  location: string;
}

interface AppointmentItem {
  id: number;
  date: Date;
  details: Details;
  time: string;
  appointment: boolean;
}

// Define the type of the props for the component
interface AppointmentCardProps {
  item: AppointmentItem[];
}


export default AppointmentCardProps