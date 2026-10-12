import { Link } from 'react-router-dom';
import { useSeo } from '../lib/seo';
export default function NotFound() {
 useSeo({title:'העמוד לא נמצא | Gutman Academy',description:'העמוד המבוקש לא נמצא. ניתן לחזור לעמוד הבית או לבחור סמינר.',path:'/404'});
 return <section className="academy-page-simple"><div className="academy-kicker">404</div><h1>לא מצאנו את העמוד הזה.</h1><p>אפשר לחזור לסמינרים ולבחור את הצעד הבא שלכם.</p><Link className="academy-button" to="/courses">לכל הסמינרים</Link></section>;
}
