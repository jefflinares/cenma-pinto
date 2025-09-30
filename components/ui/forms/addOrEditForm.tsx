import { Card, CardContent, CardHeader, CardTitle } from "../card";

  
 const AddOrEditEntityComponent = (
    title: string,
    children: React.ReactNode,
  ) => {
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
      </Card>
    );
  };

  export default AddOrEditEntityComponent