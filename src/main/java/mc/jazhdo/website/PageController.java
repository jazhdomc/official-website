package mc.jazhdo.website;


import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

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
}