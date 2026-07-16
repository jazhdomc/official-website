package mc.jazhdo.website;

import org.springframework.core.io.Resource;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;

import jakarta.servlet.http.HttpServletRequest;

@Controller
public class PageController {
    private final SiteService site;

    public PageController(SiteService site) {
        this.site = site;
    }

    // Homepage
    @GetMapping("/")
    public String home(HttpServletRequest request, Model model) {
        return site.loadPage("home", request, model);
    }

    // All other pages
    @GetMapping("/{page}")
    public String page(@PathVariable String page, HttpServletRequest request, Model model) {
        return site.loadPage(page, request, model);
    }

    // All subpages
    @GetMapping("/{folder}/{page}")
    public String subPages(@PathVariable String folder, @PathVariable String page, HttpServletRequest request, Model model) {
        return site.loadPage(folder + "/" + page, request, model);
    }

    // All css pages
    @GetMapping(value = "/css/{page}", produces = "text/css")
    @ResponseBody
    public Resource stylePages(@PathVariable String page, HttpServletRequest request) {
        return site.loadResource(page + ".css", request);
    }

    // All js pages
    @GetMapping(value = "/js/{page}", produces = "text/javascript")
    @ResponseBody
    public Resource javascriptPages(@PathVariable String page, HttpServletRequest request) {
        return site.loadResource(page + ".js", request);
    }

    // All html folder/pages without a layout
    @GetMapping(value = "/html/{folder}/{page}", produces = "text/html")
    @ResponseBody
    public Resource htmlPages(@PathVariable String folder, @PathVariable String page, HttpServletRequest request) {
        return site.loadResource(folder + "/" + page + ".html", request);
    }
}